"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { Button } from "@core/components/ui/button";
import { SupplierDialog, type SupplierRow } from "./supplier-dialog";
import { deleteSupplierAction } from "@core/modules/stock/actions";

export function SuppliersTable({ slug, suppliers }: { slug: string; suppliers: SupplierRow[] }) {
  const tc = useTranslations("common");
  const t = useTranslations("suppliers");
  const [pending, startTransition] = useTransition();

  if (suppliers.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">{tc("noData")}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tc("name")}</TableHead>
          <TableHead>{t("vatNumber")}</TableHead>
          <TableHead>{tc("email")}</TableHead>
          <TableHead>{t("phone")}</TableHead>
          <TableHead className="w-32">{tc("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{s.vatNumber ?? "—"}</TableCell>
            <TableCell className="text-sm">{s.email ?? "—"}</TableCell>
            <TableCell className="text-sm">{s.phone ?? "—"}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <SupplierDialog
                  slug={slug}
                  initial={s}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Eliminare "${s.name}"?`)) return;
                    startTransition(async () => {
                      const r = await deleteSupplierAction(slug, s.id);
                      if (r.ok) toast.success("Eliminato");
                      else toast.error(r.error);
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
