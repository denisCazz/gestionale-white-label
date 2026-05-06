import { Prisma } from "@prisma/client";
import { prisma } from "@core/lib/prisma";

export type ForecastResult = {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  weeklyAvgConsumption: number;
  predictedNext7d: number;
  daysToStockout: number | null;
  suggestedReorderQty: number;
  currentStock: number;
  minStock: number;
  hasEnoughHistory: boolean;
};

/**
 * Simple linear forecast on UNLOAD/WASTE movements over last 8 weeks.
 * Bucketize per week, fit y=a+bx, predict next week, compute days-to-stockout.
 * Pluggable: replace this function with LLM/ARIMA later.
 */
export async function forecastForClient(clientId: string): Promise<ForecastResult[]> {
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 3600 * 1000);

  const products = await prisma.product.findMany({
    where: { clientId, active: true },
    orderBy: { name: "asc" },
  });

  const movements = await prisma.stockMovement.findMany({
    where: {
      clientId,
      type: { in: ["UNLOAD", "WASTE"] },
      createdAt: { gte: eightWeeksAgo },
    },
    select: { productId: true, quantity: true, createdAt: true },
  });

  const byProduct = new Map<string, { weekIdx: number; qty: number }[]>();
  for (const m of movements) {
    const weekIdx = Math.floor(
      (m.createdAt.getTime() - eightWeeksAgo.getTime()) / (7 * 24 * 3600 * 1000)
    );
    const arr = byProduct.get(m.productId) ?? [];
    arr.push({ weekIdx, qty: Math.abs(Number(m.quantity)) });
    byProduct.set(m.productId, arr);
  }

  return products.map((p) => {
    const recs = byProduct.get(p.id) ?? [];
    const buckets = new Array(8).fill(0);
    for (const r of recs) {
      if (r.weekIdx >= 0 && r.weekIdx < 8) buckets[r.weekIdx] += r.qty;
    }
    const total = buckets.reduce((a, b) => a + b, 0);
    const avgWeekly = total / 8;
    const hasEnoughHistory = recs.length >= 4;

    let predictedNext7d = avgWeekly;
    if (hasEnoughHistory) {
      const n = buckets.length;
      const sumX = (n * (n - 1)) / 2;
      const sumX2 = buckets.reduce((acc, _, i) => acc + i * i, 0);
      const sumY = total;
      const sumXY = buckets.reduce((acc, y, i) => acc + i * y, 0);
      const denom = n * sumX2 - sumX * sumX;
      const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
      const a = (sumY - b * sumX) / n;
      predictedNext7d = Math.max(0, a + b * n);
    }

    const dailyAvg = predictedNext7d / 7;
    const daysToStockout =
      dailyAvg > 0 ? Math.max(0, Math.floor(Number(p.currentStock) / dailyAvg)) : null;

    let suggestedReorderQty = 0;
    if (predictedNext7d > Number(p.currentStock)) {
      const gap = predictedNext7d * 1.2 - Number(p.currentStock);
      const minRefill = Math.max(0, Number(p.minStock) - Number(p.currentStock));
      suggestedReorderQty = Math.ceil(Math.max(gap, minRefill));
    }

    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      weeklyAvgConsumption: Number(avgWeekly.toFixed(2)),
      predictedNext7d: Number(predictedNext7d.toFixed(2)),
      daysToStockout,
      suggestedReorderQty,
      currentStock: Number(p.currentStock),
      minStock: Number(p.minStock),
      hasEnoughHistory,
    };
  });
}

void Prisma;
