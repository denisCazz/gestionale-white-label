"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { hashPassword } from "@core/lib/auth";

const companySchema = z.object({
  ragioneSociale: z.string().min(1),
  partitaIva: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  indirizzo: z.string().optional().or(z.literal("")),
  citta: z.string().optional().or(z.literal("")),
  cap: z.string().optional().or(z.literal("")),
  provincia: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  locale: z.enum(["it", "en"]),
  currency: z.string().min(3).max(3),
});

export async function updateCompanyAction(slug: string, raw: unknown) {
  const { tenant, user } = await requireTenant(slug);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "forbidden" } as const;
  }
  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" } as const;
  const d = parsed.data;
  await prisma.client.update({
    where: { id: tenant.id },
    data: {
      ragioneSociale: d.ragioneSociale,
      partitaIva: d.partitaIva || null,
      email: d.email || null,
      telefono: d.telefono || null,
      indirizzo: d.indirizzo || null,
      citta: d.citta || null,
      cap: d.cap || null,
      provincia: d.provincia || null,
      logoUrl: d.logoUrl || null,
      primaryColor: d.primaryColor,
      locale: d.locale,
      currency: d.currency,
    },
  });
  revalidatePath(`/t/${slug}`, "layout");
  return { ok: true } as const;
}

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
  active: z.coerce.boolean().default(true),
});

export async function upsertUserAction(slug: string, raw: unknown) {
  const { tenant, user } = await requireTenant(slug);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "forbidden" } as const;
  }
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" } as const;
  const d = parsed.data;

  if (d.id) {
    const data: Parameters<typeof prisma.user.update>[0]["data"] = {
      name: d.name,
      email: d.email.toLowerCase(),
      role: d.role,
      active: d.active,
    };
    if (d.password) data.passwordHash = await hashPassword(d.password);
    await prisma.user.update({ where: { id: d.id }, data });
  } else {
    if (!d.password) return { ok: false, error: "password_required" } as const;
    await prisma.user.create({
      data: {
        clientId: tenant.id,
        name: d.name,
        email: d.email.toLowerCase(),
        role: d.role,
        active: d.active,
        passwordHash: await hashPassword(d.password),
      },
    });
  }
  revalidatePath(`/t/${slug}/settings`);
  return { ok: true } as const;
}

export async function toggleUserAction(slug: string, id: string, active: boolean) {
  const { tenant, user } = await requireTenant(slug);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "forbidden" } as const;
  }
  await prisma.user.update({ where: { id }, data: { active } });
  void tenant;
  revalidatePath(`/t/${slug}/settings`);
  return { ok: true } as const;
}
