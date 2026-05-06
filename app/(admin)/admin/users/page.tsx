import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { formatDateTime } from "@core/lib/utils";

export default async function AdminUsersPage() {
  await requireSuperAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ clientId: "asc" }, { name: "asc" }],
    include: { client: { select: { ragioneSociale: true, slug: true } } },
  });

  return (
    <div>
      <PageHeader title="Utenti globali" subtitle={`${users.length} utenti`} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultimo accesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-sm">
                    {u.client?.ragioneSociale ?? <Badge variant="default">SUPER ADMIN</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.active ? <Badge variant="success">Attivo</Badge> : <Badge variant="outline">Disabilitato</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
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
