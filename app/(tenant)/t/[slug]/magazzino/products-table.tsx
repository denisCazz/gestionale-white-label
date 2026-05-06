"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import { ProductDialog, type ProductRow } from "./product-dialog";
import { deleteProductAction } from "@core/modules/stock/actions";

export function ProductsTable({
  slug,
  products,
  categories,
  suppliers,
}: {
  slug: string;
  products: ProductRow[];
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}) {
  const t = useTranslations("stock");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();

  if (products.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">{tc("noData")}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("sku")}</TableHead>
          <TableHead>{tc("name")}</TableHead>
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("supplier")}</TableHead>
          <TableHead className="text-right">{t("currentStock")}</TableHead>
          <TableHead className="text-right">{t("minStock")}</TableHead>
          <TableHead className="text-right">{t("sellPrice")}</TableHead>
          <TableHead>{tc("status")}</TableHead>
          <TableHead className="w-32">{tc("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => {
          const isLow = p.currentStock <= p.minStock;
          return (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-xs">{p.sku}</TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.category ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.supplier ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {p.currentStock} {p.unit}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {p.minStock}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {p.sellPrice.toFixed(2)} €
              </TableCell>
              <TableCell>
                {isLow ? (
                  <Badge variant="warning">{t("underStock")}</Badge>
                ) : (
                  <Badge variant="success">{t("okStock")}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <ProductDialog
                    slug={slug}
                    categories={categories}
                    suppliers={suppliers}
                    initial={p}
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
                      if (!confirm(`Eliminare "${p.name}"?`)) return;
                      startTransition(async () => {
                        const r = await deleteProductAction(slug, p.id);
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
          );
        })}
      </TableBody>
    </Table>
  );
}
