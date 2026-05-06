import { getTranslations } from "next-intl/server";
import { Truck, Send, Check } from "lucide-react";
import { requireModule } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { GenerateButton } from "./generate-button";
import { OrderActions } from "./order-actions";
import { formatDateTime } from "@core/lib/utils";

export default async function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db } = await requireModule(slug, "supplier-orders");
  const t = await getTranslations("orders");

  const orders = await db.supplierOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    take: 100,
  });

  return (
    <div>
      <PageHeader title={t("title")} actions={<GenerateButton slug={slug} />} />

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Nessun ordine. Genera uno dai prodotti sottoscorta.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Articoli</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-44">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.number}</TableCell>
                    <TableCell>{o.supplier.name}</TableCell>
                    <TableCell className="text-sm">{o._count.items}</TableCell>
                    <TableCell className="font-mono">{Number(o.total).toFixed(2)} €</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <OrderActions
                        slug={slug}
                        orderId={o.id}
                        status={o.status}
                        canSend={!!o.supplier.email}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "destructive"; label: string }> = {
    DRAFT: { variant: "secondary", label: "Bozza" },
    SENT: { variant: "warning", label: "Inviato" },
    CONFIRMED: { variant: "default", label: "Confermato" },
    RECEIVED: { variant: "success", label: "Ricevuto" },
    CANCELLED: { variant: "destructive", label: "Annullato" },
  };
  const cfg = map[status] ?? { variant: "secondary" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
