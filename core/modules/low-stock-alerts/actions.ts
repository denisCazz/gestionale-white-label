"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@core/lib/guards";
import { resolveAlertAction as svcResolve, runLowStockScan } from "./service";

export async function resolveAlert(slug: string, alertId: string) {
  const { tenant } = await requireModule(slug, "low-stock-alerts");
  await svcResolve(alertId, tenant.id);
  revalidatePath(`/t/${slug}/avvisi`);
  return { ok: true } as const;
}

export async function runScanAction(slug: string) {
  const { tenant } = await requireModule(slug, "low-stock-alerts");
  const summary = await runLowStockScan({ clientId: tenant.id });
  revalidatePath(`/t/${slug}/avvisi`);
  return { ok: true, summary } as const;
}
