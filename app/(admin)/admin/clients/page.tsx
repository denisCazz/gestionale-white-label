import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { ClientDialog } from "./client-dialog";
import { formatDate } from "@core/lib/utils";

export default async function AdminClientsPage() {
  await requireSuperAdmin();

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, products: true } },
      modules: { where: { enabled: true }, select: { moduleKey: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Clienti"
        subtitle={`${clients.length} clienti registrati`}
        actions={
          <ClientDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Nuovo cliente
              </Button>
            }
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ragione sociale</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Utenti</TableHead>
                <TableHead>Prodotti</TableHead>
                <TableHead>Moduli attivi</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Creato</TableHead>
                <TableHead className="w-32">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.ragioneSociale}</TableCell>
                  <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                  <TableCell>{c._count.users}</TableCell>
                  <TableCell>{c._count.products}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.modules.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.active ? <Badge variant="success">Attivo</Badge> : <Badge variant="outline">Sospeso</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/clients/${c.id}`}>Gestisci</Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" title="Apri area cliente">
                        <a href={`/t/${c.slug}/dashboard`} target="_blank" rel="noopener">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
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
