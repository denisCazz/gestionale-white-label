"use server";

import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { requireModule } from "@core/lib/guards";
import { sendEmail } from "@core/lib/email";

interface ProductRow {
  id: string;
  supplierId: string | null;
  currentStock: Decimal;
  minStock: Decimal;
  costPrice: Decimal;
  supplier: { name: string; email: string | null } | null;
}

interface OrderItemRow {
  quantity: Decimal;
  unitCost: Decimal;
  product: { name: string; unit: string } | null;
}

export async function generateOrdersFromLowStock(slug: string) {
  const { db, tenant } = await requireModule(slug, "supplier-orders");

  const lows = await db.product.findMany({
    where: {
      active: true,
      supplierId: { not: null },
    },
    include: { supplier: true },
  });
  const reallyLow = lows.filter((p: ProductRow) => p.currentStock.lte(p.minStock));

  const grouped = new Map<string, typeof reallyLow>();
  for (const p of reallyLow) {
    if (!p.supplierId) continue;
    const arr = grouped.get(p.supplierId) ?? [];
    arr.push(p);
    grouped.set(p.supplierId, arr);
  }

  let created = 0;
  for (const [supplierId, products] of grouped) {
    const number = await nextOrderNumber(tenant.id);
    let total = new Decimal(0);
    const items = products.map((p: ProductRow) => {
      const qty = p.minStock.minus(p.currentStock);
      const cost = p.costPrice;
      total = total.plus(qty.times(cost));
      return { productId: p.id, quantity: qty, unitCost: cost };
    });
    await db.supplierOrder.create({
      data: {
        clientId: tenant.id,
        supplierId,
        number,
        status: "DRAFT",
        total,
        items: { create: items },
      },
    });
    created++;
  }

  revalidatePath(`/t/${slug}/ordini`);
  return { ok: true, created } as const;
}

async function nextOrderNumber(clientId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { prisma } = await import("@core/lib/prisma");
  const count = await prisma.supplierOrder.count({
    where: { clientId, createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  return `${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function sendOrderEmail(slug: string, orderId: string) {
  const { db } = await requireModule(slug, "supplier-orders");
  const order = await db.supplierOrder.findFirst({
    where: { id: orderId },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
  if (!order) return { ok: false, error: "not_found" } as const;
  if (!order.supplier?.email) return { ok: false, error: "supplier_no_email" } as const;

  const lines = order.items
    .map(
      (it: OrderItemRow) =>
        `• ${it.product?.name ?? "?"} — ${Number(it.quantity)} ${it.product?.unit ?? "pz"} @ ${Number(it.unitCost).toFixed(2)} €`
    )
    .join("\n");

  await sendEmail({
    to: order.supplier.email,
    subject: `Ordine ${order.number}`,
    text: `Buongiorno ${order.supplier.name},\n\nVi inviamo il seguente ordine:\n\n${lines}\n\nTotale: ${Number(order.total).toFixed(2)} €\n\nCordiali saluti.`,
  });

  await db.supplierOrder.update({
    where: { id: order.id },
    data: { status: "SENT", sentAt: new Date() },
  });

  revalidatePath(`/t/${slug}/ordini`);
  return { ok: true } as const;
}

export async function markOrderReceived(slug: string, orderId: string) {
  const { db, tenant } = await requireModule(slug, "supplier-orders");
  const order = await db.supplierOrder.findFirst({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "not_found" } as const;

  await db.supplierOrder.update({
    where: { id: orderId },
    data: { status: "RECEIVED", receivedAt: new Date() },
  });

  for (const it of order.items) {
    await db.product.update({
      where: { id: it.productId },
      data: { currentStock: { increment: it.quantity } },
    });
    await db.stockMovement.create({
      data: {
        clientId: tenant.id,
        productId: it.productId,
        type: "LOAD",
        quantity: it.quantity,
        unitCost: it.unitCost,
        note: `Ordine ${order.number}`,
      },
    });
  }
  revalidatePath(`/t/${slug}/ordini`);
  revalidatePath(`/t/${slug}/magazzino`);
  return { ok: true } as const;
}
