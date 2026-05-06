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
import { upsertFridgeAction } from "@core/modules/haccp/actions";

export function FridgeDialog({ slug, trigger }: { slug: string; trigger: React.ReactNode }) {
  const t = useTranslations("haccp");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newFridge")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await upsertFridgeAction(slug, data);
              if (r.ok) {
                toast.success("Salvato");
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">{tc("name")}</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Posizione</Label>
            <Input id="location" name="location" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="minTemp">{t("minTemp")}</Label>
              <Input id="minTemp" name="minTemp" type="number" step="0.1" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxTemp">{t("maxTemp")}</Label>
              <Input id="maxTemp" name="maxTemp" type="number" step="0.1" defaultValue="8" />
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
