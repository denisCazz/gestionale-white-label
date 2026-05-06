import { getTranslations } from "next-intl/server";
import { FileDown, TrendingUp, Package, DollarSign } from "lucide-react";
import { requireModule } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { reportsForClient } from "@core/modules/reports/service";
import { TopChart } from "./top-chart";
import { TypePieChart } from "./type-pie-chart";
import { formatCurrency } from "@core/lib/utils";

export default async function ReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireModule(slug, "reports");
  const t = await getTranslations("reports");

  const data = await reportsForClient(tenant.id);

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button asChild variant="outline">
            <a href={`/api/reports/export?slug=${slug}`} target="_blank" rel="noopener">
              <FileDown className="h-4 w-4" /> {t("exportCsv")}
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Prodotti attivi" value={data.productCount} icon={<Package className="h-5 w-5" />} />
        <KpiCard
          label={t("stockValue")}
          value={formatCurrency(data.stockValue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard label="Potenziale fatturato" value={formatCurrency(data.potentialRevenue)} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard label="Margine teorico" value={formatCurrency(data.margin)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("topProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TopChart data={data.top} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("movementsByType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TypePieChart data={data.byType} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
