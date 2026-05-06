"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@core/components/ui/dialog";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Button } from "@core/components/ui/button";
import { Textarea } from "@core/components/ui/textarea";
import { createMovementAction } from "@core/modules/stock/actions";

export function MovementDialog({
  slug,
  products,
}: {
  slug: string;
  products: { id: string; name: string; sku: string; unit: string }[];
}) {
  const t = useTranslations("stock");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="h-4 w-4" />
          {t("newMovement")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newMovement")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await createMovementAction(slug, data);
              if (r.ok) {
                toast.success("Movimento registrato");
                setOpen(false);
              } else {
                toast.error(r.error);
              }
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="productId">{tc("name")}</Label>
            <select
              id="productId"
              name="productId"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">{t("movementType")}</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue="LOAD"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="LOAD">{t("load")}</option>
                <option value="UNLOAD">{t("unload")}</option>
                <option value="ADJUST">{t("adjust")}</option>
                <option value="WASTE">{t("waste")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{tc("quantity")}</Label>
              <Input id="quantity" name="quantity" type="number" step="0.001" required />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="unitCost">Costo unitario (opzionale)</Label>
              <Input id="unitCost" name="unitCost" type="number" step="0.01" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">{tc("notes")}</Label>
            <Textarea id="note" name="note" rows={2} />
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
