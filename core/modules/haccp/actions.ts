"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireModule } from "@core/lib/guards";

const lotSchema = z.object({
  productId: z.string().min(1),
  lotCode: z.string().min(1),
  quantity: z.coerce.number().positive(),
  expiresAt: z.string().min(1),
  notes: z.string().optional().or(z.literal("")),
});

const fridgeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  location: z.string().optional().or(z.literal("")),
  minTemp: z.coerce.number().default(0),
  maxTemp: z.coerce.number().default(8),
});

const readingSchema = z.object({
  fridgeId: z.string().min(1),
  temperature: z.coerce.number(),
  notes: z.string().optional().or(z.literal("")),
});

export async function createLotAction(slug: string, raw: unknown) {
  const { db, tenant } = await requireModule(slug, "haccp");
  const parsed = lotSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" } as const;
  const d = parsed.data;
  await db.haccpLot.create({
    data: {
      clientId: tenant.id,
      productId: d.productId,
      lotCode: d.lotCode,
      quantity: new Prisma.Decimal(d.quantity),
      expiresAt: new Date(d.expiresAt),
      notes: d.notes || null,
    },
  });
  revalidatePath(`/t/${slug}/haccp`);
  return { ok: true } as const;
}

export async function upsertFridgeAction(slug: string, raw: unknown) {
  const { db, tenant } = await requireModule(slug, "haccp");
  const parsed = fridgeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" } as const;
  const d = parsed.data;
  const data = {
    name: d.name,
    location: d.location || null,
    minTemp: new Prisma.Decimal(d.minTemp),
    maxTemp: new Prisma.Decimal(d.maxTemp),
  };
  if (d.id) {
    await db.fridge.update({ where: { id: d.id }, data });
  } else {
    await db.fridge.create({ data: { ...data, clientId: tenant.id } });
  }
  revalidatePath(`/t/${slug}/haccp`);
  return { ok: true } as const;
}

export async function createReadingAction(slug: string, raw: unknown) {
  const { db, user, tenant } = await requireModule(slug, "haccp");
  const parsed = readingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" } as const;
  const d = parsed.data;
  const fridge = await db.fridge.findFirst({ where: { id: d.fridgeId } });
  if (!fridge) return { ok: false, error: "fridge_not_found" } as const;

  await db.fridgeReading.create({
    data: {
      clientId: tenant.id,
      fridgeId: d.fridgeId,
      temperature: new Prisma.Decimal(d.temperature),
      notes: d.notes || null,
      userId: user.id,
    },
  });

  const t = new Prisma.Decimal(d.temperature);
  if (t.lt(fridge.minTemp) || t.gt(fridge.maxTemp)) {
    await db.alert.create({
      data: {
        clientId: tenant.id,
        type: "FRIDGE_OUT_OF_RANGE",
        severity: "CRITICAL",
        title: `Frigo ${fridge.name} fuori range`,
        message: `Lettura ${d.temperature}°C (range ${fridge.minTemp.toString()}–${fridge.maxTemp.toString()}°C)`,
        meta: { fridgeId: fridge.id, temperature: d.temperature },
      },
    });
  }

  revalidatePath(`/t/${slug}/haccp`);
  return { ok: true } as const;
}
