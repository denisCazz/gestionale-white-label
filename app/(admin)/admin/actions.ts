"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { hashPassword } from "@core/lib/auth";
import { MODULES } from "@core/modules/registry";

const clientSchema = z.object({
  ragioneSociale: z.string().min(1),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  partitaIva: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0ea5e9"),
  locale: z.enum(["it", "en"]).default("it"),
  adminEmail: z.string().email(),
  adminName: z.string().min(1),
  adminPassword: z.string().min(8),
});

export async function createClientAction(raw: unknown) {
  await requireSuperAdmin();
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" } as const;
  const d = parsed.data;

  const existing = await prisma.client.findUnique({ where: { slug: d.slug } });
  if (existing) return { ok: false, error: "slug_exists" } as const;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const c = await tx.client.create({
      data: {
        ragioneSociale: d.ragioneSociale,
        slug: d.slug,
        partitaIva: d.partitaIva || null,
        email: d.email || null,
        primaryColor: d.primaryColor,
        locale: d.locale,
        modules: {
          create: MODULES.filter((m) => !m.isPaid).map((m) => ({
            moduleKey: m.key,
            enabled: true,
          })),
        },
      },
    });

    await tx.user.create({
      data: {
        clientId: c.id,
        email: d.adminEmail.toLowerCase(),
        name: d.adminName,
        role: "ADMIN",
        passwordHash: await hashPassword(d.adminPassword),
      },
    });
  });

  revalidatePath("/admin/clients");
  return { ok: true } as const;
}

export async function toggleClientModuleAction(
  clientId: string,
  moduleKey: string,
  enabled: boolean,
  expiresAt?: string | null
) {
  await requireSuperAdmin();
  const exp = expiresAt ? new Date(expiresAt) : null;
  await prisma.clientModule.upsert({
    where: { clientId_moduleKey: { clientId, moduleKey } },
    create: { clientId, moduleKey, enabled, expiresAt: exp },
    update: { enabled, expiresAt: exp },
  });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { ok: true } as const;
}

export async function setClientActiveAction(clientId: string, active: boolean) {
  await requireSuperAdmin();
  await prisma.client.update({ where: { id: clientId }, data: { active } });
  revalidatePath("/admin/clients");
  return { ok: true } as const;
}
