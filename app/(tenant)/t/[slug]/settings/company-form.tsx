"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Button } from "@core/components/ui/button";
import { updateCompanyAction } from "./actions";

export function CompanyForm({
  slug,
  initial,
  canEdit,
}: {
  slug: string;
  initial: {
    ragioneSociale: string;
    partitaIva: string | null;
    email: string | null;
    telefono: string | null;
    indirizzo: string | null;
    citta: string | null;
    cap: string | null;
    provincia: string | null;
    logoUrl: string | null;
    primaryColor: string;
    locale: string;
    currency: string;
  };
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        startTransition(async () => {
          const r = await updateCompanyAction(slug, data);
          if (r.ok) toast.success("Salvato");
          else toast.error(r.error);
        });
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Field label="Ragione sociale" name="ragioneSociale" defaultValue={initial.ragioneSociale} required />
      <Field label="P.IVA" name="partitaIva" defaultValue={initial.partitaIva ?? ""} />
      <Field label="Email" name="email" type="email" defaultValue={initial.email ?? ""} />
      <Field label="Telefono" name="telefono" defaultValue={initial.telefono ?? ""} />
      <Field label="Indirizzo" name="indirizzo" defaultValue={initial.indirizzo ?? ""} className="md:col-span-2" />
      <Field label="Città" name="citta" defaultValue={initial.citta ?? ""} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="CAP" name="cap" defaultValue={initial.cap ?? ""} />
        <Field label="Provincia" name="provincia" defaultValue={initial.provincia ?? ""} />
      </div>
      <Field label="URL Logo" name="logoUrl" defaultValue={initial.logoUrl ?? ""} className="md:col-span-2" />
      <div className="space-y-1.5">
        <Label htmlFor="primaryColor">Colore primario</Label>
        <Input id="primaryColor" name="primaryColor" type="color" defaultValue={initial.primaryColor} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="locale">Lingua default</Label>
        <select
          id="locale"
          name="locale"
          defaultValue={initial.locale}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
      </div>
      <Field label="Valuta" name="currency" defaultValue={initial.currency} />
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending || !canEdit}>
          Salva
        </Button>
      </div>
    </form>
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
