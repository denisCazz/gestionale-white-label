"use server";

import { requireTenant } from "@core/lib/guards";
import { sendEmail } from "@core/lib/email";
import { prisma } from "@core/lib/prisma";

export async function requestModuleAction(slug: string, moduleKey: string) {
  const { user, tenant } = await requireTenant(slug);

  const [dbMod, client] = await Promise.all([
    prisma.module.findUnique({ where: { key: moduleKey } }),
    prisma.client.findUnique({
      where: { id: tenant.id },
      select: { ragioneSociale: true, email: true },
    }),
  ]);

  if (!dbMod) return { error: "Modulo non trovato" };

  const parts: string[] = [];
  if (dbMod.priceMonthly) parts.push(`€${Number(dbMod.priceMonthly).toFixed(2)}/mese`);
  if (dbMod.priceOneTime) parts.push(`€${Number(dbMod.priceOneTime).toFixed(2)} una tantum`);
  const price = parts.length > 0 ? parts.join(" oppure ") : "gratuito";

  await sendEmail({
    to: "deniscazzulo@icloud.com",
    subject: `[Richiesta modulo] ${dbMod.name} — ${client?.ragioneSociale ?? slug}`,
    html: `
      <h2>Richiesta di sblocco modulo</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Cliente</td><td>${client?.ragioneSociale ?? slug}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Slug</td><td>${slug}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Richiedente</td><td>${user.name} &lt;${user.email}&gt;</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Modulo</td><td>${dbMod.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Prezzo</td><td>${price}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Email cliente</td><td>${client?.email ?? "—"}</td></tr>
      </table>
      <p style="margin-top:16px;color:#666">Per attivare il modulo accedi al pannello Super-Admin.</p>
    `,
  });

  return { ok: true };
}
