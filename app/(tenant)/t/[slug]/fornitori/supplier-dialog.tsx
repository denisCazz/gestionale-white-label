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
import { upsertSupplierAction } from "@core/modules/stock/actions";

export type SupplierRow = {
  id: string;
  name: string;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export function SupplierDialog({
  slug,
  initial,
  trigger,
}: {
  slug: string;
  initial?: SupplierRow;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? tc("edit") : t("newSupplier")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await upsertSupplierAction(slug, { ...data, id: initial?.id });
              if (r.ok) {
                toast.success("Salvato");
                setOpen(false);
              } else {
                toast.error(r.error);
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={tc("name")} name="name" defaultValue={initial?.name} required />
            <Field label={t("vatNumber")} name="vatNumber" defaultValue={initial?.vatNumber ?? ""} />
            <Field label={tc("email")} name="email" type="email" defaultValue={initial?.email ?? ""} />
            <Field label={t("phone")} name="phone" defaultValue={initial?.phone ?? ""} />
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input id="address" name="address" defaultValue={initial?.address ?? ""} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="notes">{tc("notes")}</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
            </div>
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
