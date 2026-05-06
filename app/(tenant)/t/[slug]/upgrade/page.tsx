import { getTranslations } from "next-intl/server";
import { Lock, Mail } from "lucide-react";
import { requireTenant } from "@core/lib/guards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Badge } from "@core/components/ui/badge";
import { getModule } from "@core/modules/registry";
import { PageHeader } from "@core/components/layout/page-header";

export default async function UpgradePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const { slug } = await params;
  const { module: moduleKey } = await searchParams;
  await requireTenant(slug);
  const t = await getTranslations("upgrade");

  const mod = moduleKey ? getModule(moduleKey) : null;

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
                {mod?.name ?? "Modulo premium"}
                <Badge variant="secondary">PRO</Badge>
              </CardTitle>
              <CardDescription className="mt-1">{mod?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mod?.priceMonthly && (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">€{mod.priceMonthly}</span>
              <span className="text-muted-foreground">{t("perMonth")}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{t("contactAdmin")}</p>
          <Button asChild>
            <a href={`mailto:support@example.com?subject=Attivazione modulo ${mod?.name}`}>
              <Mail className="h-4 w-4" />
              Contatta supporto
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
