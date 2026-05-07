import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { requireTenant } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { getModule } from "@core/modules/registry";
import { PageHeader } from "@core/components/layout/page-header";
import { RequestModuleButton } from "./request-module-button";

export default async function UpgradePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const { slug } = await params;
  const { module: moduleKey } = await searchParams;
  const { user } = await requireTenant(slug);
  const t = await getTranslations("upgrade");

  const registryMod = moduleKey ? getModule(moduleKey) : null;

  // Leggi prezzo e dettagli dal DB
  const dbMod = moduleKey
    ? await prisma.module.findUnique({ where: { key: moduleKey } })
    : null;

  const canRequest = user.role === "ADMIN" || user.role === "MANAGER";
  const priceMonthly = dbMod?.priceMonthly ? Number(dbMod.priceMonthly) : null;
  const priceOneTime = dbMod?.priceOneTime ? Number(dbMod.priceOneTime) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {dbMod?.name ?? registryMod?.name ?? "Modulo premium"}
                <Badge variant="secondary">PRO</Badge>
              </CardTitle>
              <CardDescription className="mt-1">{dbMod?.description ?? registryMod?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(priceMonthly !== null || priceOneTime !== null) && (
            <div className="flex flex-wrap gap-6">
              {priceMonthly !== null && (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">€{priceMonthly.toFixed(2)}</span>
                  <span className="text-muted-foreground">{t("perMonth")}</span>
                </div>
              )}
              {priceOneTime !== null && (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">€{priceOneTime.toFixed(2)}</span>
                  <span className="text-muted-foreground text-sm">una tantum</span>
                </div>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {canRequest
              ? "Clicca il pulsante per richiedere l'attivazione. Riceverai una risposta entro 24 ore."
              : t("contactAdmin")}
          </p>
          {canRequest && (registryMod || dbMod) && moduleKey && (
            <RequestModuleButton
              slug={slug}
              moduleKey={moduleKey}
              moduleName={dbMod?.name ?? registryMod?.name ?? moduleKey}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
