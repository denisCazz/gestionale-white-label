"use client";

import { useState, useTransition } from "react";
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
import { createClientAction } from "../actions";

export function ClientDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo cliente</DialogTitle>
          <DialogDescription>
            Crea il cliente, l'utente admin iniziale e attiva i moduli free.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data = Object.fromEntries(fd.entries());
            startTransition(async () => {
              const r = await createClientAction(data);
              if (r.ok) {
                toast.success("Cliente creato");
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ragione sociale" name="ragioneSociale" required />
            <Field label="Slug (url)" name="slug" required pattern="[a-z0-9-]+" placeholder="bar-mario" />
            <Field label="P.IVA" name="partitaIva" />
            <Field label="Email azienda" name="email" type="email" />
            <div className="space-y-1.5">
              <Label htmlFor="primaryColor">Colore primario</Label>
              <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#0ea5e9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale">Lingua</Label>
              <select
                id="locale"
                name="locale"
                defaultValue="it"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="border-t pt-3 mt-3">
            <p className="text-sm font-medium mb-2">Utente admin iniziale</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" name="adminName" required />
              <Field label="Email" name="adminEmail" type="email" required />
              <Field label="Password" name="adminPassword" type="password" minLength={8} required className="col-span-2" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={pending}>
              Crea cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
