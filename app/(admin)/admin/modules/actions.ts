"use server";

import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateModulePriceAction(
  moduleKey: string,
  priceMonthly: number | null,
  priceOneTime: number | null,
) {
  await requireSuperAdmin();

  await prisma.module.update({
    where: { key: moduleKey },
    data: {
      priceMonthly: priceMonthly !== null ? priceMonthly : null,
      priceOneTime: priceOneTime !== null ? priceOneTime : null,
    },
  });

  revalidatePath("/admin/modules");
}
