import { Prisma } from "@prisma/client";
import { prisma } from "@core/lib/prisma";
import { sendEmail } from "@core/lib/email";

/**
 * Re-evaluate low-stock for a single product:
 * - if currentStock <= minStock and no open alert → create alert
 * - if currentStock > minStock and open alert → resolve it
 */
export async function evaluateLowStockForProduct(clientId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, clientId },
  });
  if (!product || !product.active) return;

  const isLow = product.currentStock.lte(product.minStock);
  const openAlert = await prisma.alert.findFirst({
    where: {
      clientId,
      productId,
      type: "LOW_STOCK",
      resolved: false,
    },
  });

  if (isLow && !openAlert) {
    await prisma.alert.create({
      data: {
        clientId,
        productId,
        type: "LOW_STOCK",
        severity: "WARNING",
        title: `Sottoscorta: ${product.name}`,
        message: `Giacenza ${product.currentStock.toString()} ${product.unit} ≤ soglia ${product.minStock.toString()} ${product.unit}`,
        meta: {
          currentStock: product.currentStock.toString(),
          minStock: product.minStock.toString(),
          unit: product.unit,
        },
      },
    });
  } else if (!isLow && openAlert) {
    await prisma.alert.update({
      where: { id: openAlert.id },
      data: { resolved: true, resolvedAt: new Date() },
    });
  }
}

/**
 * Daily scan: evaluate every active product for every active client with module enabled.
 * Returns summary + sends digest emails to admins.
 */
export async function runLowStockScan(opts: { clientId?: string } = {}) {
  const now = new Date();
  const enabledClients = await prisma.clientModule.findMany({
    where: {
      moduleKey: "low-stock-alerts",
      enabled: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(opts.clientId ? { clientId: opts.clientId } : {}),
      client: { active: true },
    },
    include: { client: { select: { id: true, slug: true, ragioneSociale: true } } },
  });

  const summary: Array<{ clientId: string; created: number; resolved: number }> = [];

  for (const cm of enabledClients) {
    const products = await prisma.product.findMany({
      where: { clientId: cm.clientId, active: true },
      select: { id: true },
    });
    let created = 0;
    let resolved = 0;
    for (const p of products) {
      const before = await prisma.alert.count({
        where: { clientId: cm.clientId, productId: p.id, type: "LOW_STOCK", resolved: false },
      });
      await evaluateLowStockForProduct(cm.clientId, p.id);
      const after = await prisma.alert.count({
        where: { clientId: cm.clientId, productId: p.id, type: "LOW_STOCK", resolved: false },
      });
      if (after > before) created++;
      if (after < before) resolved++;
    }

    if (created > 0) {
      const lows = await prisma.alert.findMany({
        where: { clientId: cm.clientId, type: "LOW_STOCK", resolved: false },
        include: { product: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const admins = await prisma.user.findMany({
        where: { clientId: cm.clientId, role: { in: ["ADMIN", "MANAGER"] }, active: true },
        select: { email: true },
      });
      if (admins.length > 0) {
        const lines = lows
          .map((a) => `• ${a.product?.name ?? "?"} — ${a.message}`)
          .join("\n");
        await sendEmail({
          to: admins.map((a) => a.email),
          subject: `[${cm.client.ragioneSociale}] ${created} nuovi avvisi sottoscorta`,
          text: `Sono stati rilevati ${created} prodotti sottoscorta:\n\n${lines}\n\nAccedi al gestionale per dettagli.`,
        }).catch(() => undefined);
      }
    }

    summary.push({ clientId: cm.clientId, created, resolved });
  }

  return summary;
}

export async function resolveAlertAction(alertId: string, clientId: string) {
  const a = await prisma.alert.findFirst({ where: { id: alertId, clientId } });
  if (!a) return;
  if (a.resolved) return;
  await prisma.alert.update({
    where: { id: a.id },
    data: { resolved: true, resolvedAt: new Date() },
  });
}

export type StockSnapshot = { current: Prisma.Decimal; min: Prisma.Decimal };
