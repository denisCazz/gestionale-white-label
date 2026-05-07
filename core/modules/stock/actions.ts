"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireTenant } from "@core/lib/guards";
import { productSchema, movementSchema, supplierSchema } from "./schemas";
import { prisma } from "@core/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertProductAction(slug: string, raw: unknown): Promise<ActionResult> {
  const { db, tenant } = await requireTenant(slug);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  const d = parsed.data;
  const data = {
    sku: d.sku,
    name: d.name,
    barcode: d.barcode || null,
    unit: d.unit,
    description: d.description || null,
    categoryId: d.categoryId || null,
    supplierId: d.supplierId || null,
    costPrice: new Prisma.Decimal(d.costPrice),
    sellPrice: new Prisma.Decimal(d.sellPrice),
    vatRate: new Prisma.Decimal(d.vatRate),
    minStock: new Prisma.Decimal(d.minStock),
    active: d.active,
  };
  if (d.id) {
    await db.product.update({ where: { id: d.id }, data });
  } else {
    await db.product.create({ data: { ...data, clientId: tenant.id } });
  }
  revalidatePath(`/t/${slug}/magazzino`);
  revalidatePath(`/t/${slug}/dashboard`);
  return { ok: true };
}

export async function deleteProductAction(slug: string, id: string): Promise<ActionResult> {
  const { db } = await requireTenant(slug);
  await db.product.update({ where: { id }, data: { active: false } });
  revalidatePath(`/t/${slug}/magazzino`);
  return { ok: true };
}

export async function createMovementAction(slug: string, raw: unknown): Promise<ActionResult> {
  const { db, user, tenant } = await requireTenant(slug);
  const parsed = movementSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: d.productId, clientId: tenant.id },
    });
    if (!product) throw new Error("product_not_found");

    const qty = new Prisma.Decimal(d.quantity);
    let delta = qty;
    if (d.type === "UNLOAD" || d.type === "WASTE" || d.type === "TRANSFER") {
      delta = qty.neg();
    } else if (d.type === "ADJUST") {
      delta = qty.minus(product.currentStock);
    }

    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: { increment: delta } },
    });

    await tx.stockMovement.create({
      data: {
        clientId: tenant.id,
        productId: product.id,
        type: d.type,
        quantity: qty,
        unitCost: d.unitCost != null ? new Prisma.Decimal(d.unitCost) : null,
        note: d.note || null,
        userId: user.id,
      },
    });
  });

  // re-evaluate alert if low-stock module enabled
  if (tenant.enabledModules.includes("low-stock-alerts")) {
    const { evaluateLowStockForProduct } = await import(
      "@core/modules/low-stock-alerts/service"
    );
    await evaluateLowStockForProduct(tenant.id, d.productId);
  }

  void db;
  revalidatePath(`/t/${slug}/magazzino`);
  revalidatePath(`/t/${slug}/dashboard`);
  return { ok: true };
}

export async function upsertCategoryAction(slug: string, name: string, color?: string) {
  const { db, tenant } = await requireTenant(slug);
  await db.productCategory.upsert({
    where: { clientId_name: { clientId: tenant.id, name } },
    update: { color: color || null },
    create: { name, color: color || null, clientId: tenant.id },
  });
  revalidatePath(`/t/${slug}/magazzino`);
  return { ok: true } as const;
}

export async function upsertSupplierAction(slug: string, raw: unknown): Promise<ActionResult> {
  const { db, tenant } = await requireTenant(slug);
  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  const d = parsed.data;
  const data = {
    name: d.name,
    vatNumber: d.vatNumber || null,
    email: d.email || null,
    phone: d.phone || null,
    address: d.address || null,
    notes: d.notes || null,
    active: d.active,
  };
  if (d.id) {
    await db.supplier.update({ where: { id: d.id }, data });
  } else {
    await db.supplier.create({ data: { ...data, clientId: tenant.id } });
  }
  revalidatePath(`/t/${slug}/fornitori`);
  return { ok: true };
}

export async function deleteSupplierAction(slug: string, id: string): Promise<ActionResult> {
  const { db } = await requireTenant(slug);
  await db.supplier.update({ where: { id }, data: { active: false } });
  revalidatePath(`/t/${slug}/fornitori`);
  return { ok: true };
}
