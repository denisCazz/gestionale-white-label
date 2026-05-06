import { prisma } from "@core/lib/prisma";
import { Prisma } from "@prisma/client";

export async function reportsForClient(clientId: string) {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [topMoved, byTypeRaw, products] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: { clientId, createdAt: { gte: since } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.stockMovement.groupBy({
      by: ["type"],
      where: { clientId, createdAt: { gte: since } },
      _sum: { quantity: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { clientId, active: true },
      select: { id: true, name: true, sku: true, currentStock: true, costPrice: true, sellPrice: true },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const top = topMoved
    .map((g) => {
      const p = productMap.get(g.productId);
      return p
        ? {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            qty: Number(g._sum.quantity ?? 0),
          }
        : null;
    })
    .filter(Boolean) as Array<{ productId: string; name: string; sku: string; qty: number }>;

  const byType = byTypeRaw.map((b) => ({
    type: b.type,
    qty: Number(b._sum.quantity ?? 0),
    count: b._count,
  }));

  let stockValue = new Prisma.Decimal(0);
  let potentialRevenue = new Prisma.Decimal(0);
  for (const p of products) {
    stockValue = stockValue.plus(p.currentStock.times(p.costPrice));
    potentialRevenue = potentialRevenue.plus(p.currentStock.times(p.sellPrice));
  }

  return {
    top,
    byType,
    stockValue: Number(stockValue.toFixed(2)),
    potentialRevenue: Number(potentialRevenue.toFixed(2)),
    margin: Number(potentialRevenue.minus(stockValue).toFixed(2)),
    productCount: products.length,
  };
}
