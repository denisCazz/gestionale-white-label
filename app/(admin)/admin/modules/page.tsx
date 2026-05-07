import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { EditPriceDialog } from "./edit-price-dialog";

export default async function ModulesPage() {
  await requireSuperAdmin();

  const modules = await prisma.module.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const stats = await Promise.all(
    modules.map(async (m) => {
      const enabledCount = await prisma.clientModule.count({
        where: { moduleKey: m.key, enabled: true },
      });
      return { mod: m, enabledCount };
    })
  );

  return (
    <div>
      <PageHeader title="Moduli" subtitle="Catalogo moduli disponibili" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Abbonamento</TableHead>
                <TableHead>Una tantum</TableHead>
                <TableHead>Clienti attivi</TableHead>
                <TableHead>Descrizione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map(({ mod, enabledCount }) => (
                <TableRow key={mod.key}>
                  <TableCell className="font-medium">{mod.name}</TableCell>
                  <TableCell>
                    {mod.isPaid ? <Badge variant="secondary">PRO</Badge> : <Badge variant="success">Free</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{mod.priceMonthly ? `€${Number(mod.priceMonthly).toFixed(2)}/mese` : "—"}</span>
                      {mod.isPaid && (
                        <EditPriceDialog
                          moduleKey={mod.key}
                          moduleName={mod.name}
                          currentPriceMonthly={mod.priceMonthly ? Number(mod.priceMonthly) : null}
                          currentPriceOneTime={mod.priceOneTime ? Number(mod.priceOneTime) : null}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mod.priceOneTime ? `€${Number(mod.priceOneTime).toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{enabledCount}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md">{mod.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
