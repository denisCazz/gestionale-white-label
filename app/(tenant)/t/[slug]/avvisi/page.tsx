import { getTranslations } from "next-intl/server";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireModule } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import { ScanButton } from "./scan-button";
import { ResolveButton } from "./resolve-button";
import { formatDateTime } from "@core/lib/utils";

export default async function AlertsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: "open" | "resolved" }>;
}) {
  const { slug } = await params;
  const { status = "open" } = await searchParams;
  const { db } = await requireModule(slug, "low-stock-alerts");
  const t = await getTranslations("alerts");

  const alerts = await db.alert.findMany({
    where: { resolved: status === "resolved" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true, sku: true, unit: true } } },
  });

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={<ScanButton slug={slug} />}
      />

      <div className="flex gap-2 mb-4">
        <Button asChild variant={status === "open" ? "default" : "outline"} size="sm">
          <a href={`/t/${slug}/avvisi?status=open`}>{t("open")}</a>
        </Button>
        <Button asChild variant={status === "resolved" ? "default" : "outline"} size="sm">
          <a href={`/t/${slug}/avvisi?status=resolved`}>{t("resolved")}</a>
        </Button>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-600" />
            {t("noOpen")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(alerts as (typeof alerts)[number][]).map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{a.title}</p>
                    <Badge
                      variant={
                        a.severity === "CRITICAL"
                          ? "destructive"
                          : a.severity === "WARNING"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(a.createdAt)}</p>
                </div>
                {!a.resolved && <ResolveButton slug={slug} id={a.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
