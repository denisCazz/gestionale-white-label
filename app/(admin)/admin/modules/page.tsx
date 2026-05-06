import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { MODULES } from "@core/modules/registry";

export default async function ModulesPage() {
  await requireSuperAdmin();

  const stats = await Promise.all(
    MODULES.map(async (m) => {
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
                <TableHead>Prezzo</TableHead>
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
                  <TableCell>{mod.priceMonthly ? `€${mod.priceMonthly}/mese` : "—"}</TableCell>
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
