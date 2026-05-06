"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { createLotAction } from "@core/modules/haccp/actions";

export function LotDialog({
  slug,
  products,
  trigger,
}: {
  slug: string;
  products: { id: string; name: string; sku: string }[];
  trigger: React.ReactNode;
}) {
  const t = useTranslations("haccp");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newLot")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await createLotAction(slug, data);
              if (r.ok) {
                toast.success("Lotto creato");
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="productId">Prodotto</Label>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lotCode">{t("lotCode")}</Label>
              <Input id="lotCode" name="lotCode" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{tc("quantity")}</Label>
              <Input id="quantity" name="quantity" type="number" step="0.001" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">{t("expiresAt")}</Label>
            <Input id="expiresAt" name="expiresAt" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{tc("notes")}</Label>
            <Textarea id="notes" name="notes" rows={2} />
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
