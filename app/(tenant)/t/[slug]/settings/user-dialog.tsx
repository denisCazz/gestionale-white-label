"use client";

import { useState, useTransition } from "react";
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
import { upsertUserAction } from "./actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
};

export function UserDialog({
  slug,
  initial,
  trigger,
}: {
  slug: string;
  initial?: UserRow;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Modifica utente" : "Nuovo utente"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await upsertUserAction(slug, { ...data, id: initial?.id });
              if (r.ok) {
                toast.success("Salvato");
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={initial?.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={initial?.email} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password {initial ? "(lascia vuoto per non cambiare)" : ""}</Label>
            <Input id="password" name="password" type="password" minLength={initial ? 0 : 8} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Ruolo</Label>
            <select
              id="role"
              name="role"
              required
              defaultValue={initial?.role ?? "STAFF"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={pending}>
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
