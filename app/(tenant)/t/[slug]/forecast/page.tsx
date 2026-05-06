import { getTranslations } from "next-intl/server";
import { Sparkles, AlertTriangle } from "lucide-react";
import { requireModule } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { forecastForClient } from "@core/modules/ai-forecast/service";

export default async function ForecastPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireModule(slug, "ai-forecast");
  const t = await getTranslations("forecast");

  const results = await forecastForClient(tenant.id);
  const sorted = results
    .slice()
    .sort((a, b) => (a.daysToStockout ?? 9999) - (b.daysToStockout ?? 9999));

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Prodotto</TableHead>
                <TableHead className="text-right">{t("weeklyAvg")}</TableHead>
                <TableHead className="text-right">{t("predictedConsumption")}</TableHead>
                <TableHead className="text-right">Giacenza</TableHead>
                <TableHead className="text-right">{t("stockoutDays")}</TableHead>
                <TableHead className="text-right">{t("suggestedReorder")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.productId}>
                  <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                  <TableCell className="font-medium">
                    {r.name}
                    {!r.hasEnoughHistory && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {t("noHistory")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {r.weeklyAvgConsumption} {r.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.predictedNext7d} {r.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.currentStock} {r.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.daysToStockout == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : r.daysToStockout < 7 ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {r.daysToStockout} gg
                      </Badge>
                    ) : r.daysToStockout < 14 ? (
                      <Badge variant="warning">{r.daysToStockout} gg</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">{r.daysToStockout} gg</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {r.suggestedReorderQty > 0 ? (
                      <span className="text-primary">
                        {r.suggestedReorderQty} {r.unit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
