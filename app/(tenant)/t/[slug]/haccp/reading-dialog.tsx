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
import { createReadingAction } from "@core/modules/haccp/actions";

export function ReadingDialog({
  slug,
  fridges,
  defaultFridgeId,
  trigger,
}: {
  slug: string;
  fridges: { id: string; name: string }[];
  defaultFridgeId?: string;
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
          <DialogTitle>{t("newReading")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await createReadingAction(slug, data);
              if (r.ok) {
                toast.success("Rilevazione registrata");
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fridgeId">Frigo</Label>
            <select
              id="fridgeId"
              name="fridgeId"
              required
              defaultValue={defaultFridgeId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {fridges.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temperature">{t("temperature")} (°C)</Label>
            <Input id="temperature" name="temperature" type="number" step="0.1" required />
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
