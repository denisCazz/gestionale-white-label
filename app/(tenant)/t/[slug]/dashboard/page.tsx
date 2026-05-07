import { getTranslations } from "next-intl/server";
import { Package, TrendingDown, ArrowRightLeft, BellRing } from "lucide-react";
import { requireTenant } from "@core/lib/guards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { PageHeader } from "@core/components/layout/page-header";
import { formatDateTime } from "@core/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db } = await requireTenant(slug);
  const t = await getTranslations("dashboard");
  const tStock = await getTranslations("stock");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalProducts, lowStock, todayMovementCount, openAlerts, recentMovements] = await Promise.all([
    db.product.count({ where: { active: true } }),
    db.product.count({
      where: {
        active: true,
        currentStock: { lte: new Decimal(0) },
      },
    }),
    db.stockMovement.count({ where: { createdAt: { gte: startOfDay } } }),
    db.alert.count({ where: { resolved: false } }),
    db.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { product: { select: { name: true, sku: true, unit: true } } },
    }),
  ]);

  const lowStockProducts = await db.product.findMany({
    where: { active: true },
    orderBy: { currentStock: "asc" },
    take: 5,
    select: { id: true, name: true, sku: true, currentStock: true, minStock: true, unit: true },
  });
  type LowStockRow = (typeof lowStockProducts)[number];
  type MovementRow = (typeof recentMovements)[number];
  const actuallyLow = lowStockProducts.filter(
    (p: LowStockRow) => Number(p.currentStock) <= Number(p.minStock)
  );

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("totalProducts")} value={totalProducts} icon={<Package className="h-5 w-5" />} />
        <StatCard
          label={t("lowStock")}
          value={actuallyLow.length}
          icon={<TrendingDown className="h-5 w-5" />}
          variant={actuallyLow.length > 0 ? "warning" : "default"}
        />
        <StatCard label={t("todayMovements")} value={todayMovementCount} icon={<ArrowRightLeft className="h-5 w-5" />} />
        <StatCard
          label={t("openAlerts")}
          value={openAlerts}
          icon={<BellRing className="h-5 w-5" />}
          variant={openAlerts > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{tStock("underStock")}</CardTitle>
            <CardDescription>{actuallyLow.length} {tStock("title").toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            {actuallyLow.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun prodotto sotto la soglia.</p>
            ) : (
              <ul className="divide-y">
                {actuallyLow.map((p: LowStockRow) => (
                  <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge variant="warning">
                      {Number(p.currentStock)} / {Number(p.minStock)} {p.unit}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tStock("movements")}</CardTitle>
            <CardDescription>Ultimi 8 movimenti</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun movimento.</p>
            ) : (
              <ul className="divide-y">
                {recentMovements.map((m: MovementRow) => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                    </div>
                    <Badge variant={m.type === "LOAD" ? "success" : m.type === "WASTE" ? "destructive" : "secondary"}>
                      {m.type === "LOAD" ? "+" : "-"}
                      {Number(m.quantity)} {m.product.unit}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={variant === "warning" ? "text-amber-600" : "text-primary"}>{icon}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
