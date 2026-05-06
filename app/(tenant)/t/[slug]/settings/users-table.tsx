"use client";

import { useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { Button } from "@core/components/ui/button";
import { Badge } from "@core/components/ui/badge";
import { Switch } from "@core/components/ui/switch";
import { UserDialog, type UserRow } from "./user-dialog";
import { toggleUserAction } from "./actions";
import { formatDateTime } from "@core/lib/utils";

export function UsersTable({ slug, users }: { slug: string; users: UserRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ruolo</TableHead>
          <TableHead>Ultimo accesso</TableHead>
          <TableHead>Attivo</TableHead>
          <TableHead className="w-20">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{u.role}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
            </TableCell>
            <TableCell>
              <Switch
                checked={u.active}
                disabled={pending}
                onCheckedChange={(v) =>
                  startTransition(async () => {
                    const r = await toggleUserAction(slug, u.id, v);
                    if (r.ok) toast.success("Aggiornato");
                  })
                }
              />
            </TableCell>
            <TableCell>
              <UserDialog
                slug={slug}
                initial={u}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
