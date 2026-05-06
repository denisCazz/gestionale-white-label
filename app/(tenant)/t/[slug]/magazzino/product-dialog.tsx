"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@core/components/ui/dialog";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Button } from "@core/components/ui/button";
import { upsertProductAction } from "@core/modules/stock/actions";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  barcode: string | null;
  description: string | null;
  category: string | null;
  supplier: string | null;
  categoryId: string | null;
  supplierId: string | null;
  currentStock: number;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  vatRate: number;
};

export function ProductDialog({
  slug,
  categories,
  suppliers,
  initial,
  trigger,
}: {
  slug: string;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  initial?: ProductRow;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("stock");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? tc("edit") : t("newProduct")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await upsertProductAction(slug, { ...data, id: initial?.id });
              if (r.ok) {
                toast.success(initial ? "Aggiornato" : "Creato");
                setOpen(false);
              } else {
                toast.error(r.error);
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("sku")} name="sku" defaultValue={initial?.sku} required />
            <Field label={tc("name")} name="name" defaultValue={initial?.name} required />
            <Field label={t("barcode")} name="barcode" defaultValue={initial?.barcode ?? ""} />
            <Field label={t("unit")} name="unit" defaultValue={initial?.unit ?? "pz"} required />
            <SelectField
              label={t("category")}
              name="categoryId"
              defaultValue={initial?.categoryId ?? ""}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <SelectField
              label={t("supplier")}
              name="supplierId"
              defaultValue={initial?.supplierId ?? ""}
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            />
            <Field
              label={t("costPrice")}
              name="costPrice"
              type="number"
              step="0.01"
              defaultValue={initial?.costPrice ?? 0}
            />
            <Field
              label={t("sellPrice")}
              name="sellPrice"
              type="number"
              step="0.01"
              defaultValue={initial?.sellPrice ?? 0}
            />
            <Field
              label={t("vatRate")}
              name="vatRate"
              type="number"
              step="0.5"
              defaultValue={initial?.vatRate ?? 22}
            />
            <Field
              label={t("minStock")}
              name="minStock"
              type="number"
              step="0.01"
              defaultValue={initial?.minStock ?? 0}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
