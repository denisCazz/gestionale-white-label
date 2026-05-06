"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@core/components/ui/switch";
import { setClientActiveAction } from "../../actions";

export function ClientStatusToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{active ? "Attivo" : "Sospeso"}</span>
      <Switch
        checked={active}
        disabled={pending}
        onCheckedChange={(v) =>
          startTransition(async () => {
            const r = await setClientActiveAction(id, v);
            if (r.ok) toast.success("Aggiornato");
          })
        }
      />
    </div>
  );
}
