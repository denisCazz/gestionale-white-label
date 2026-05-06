"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@core/components/ui/switch";
import { Input } from "@core/components/ui/input";
import { toggleClientModuleAction } from "../../actions";

export function ModuleToggle({
  clientId,
  moduleKey,
  enabled,
  expiresAt,
  isPaid,
}: {
  clientId: string;
  moduleKey: string;
  enabled: boolean;
  expiresAt: string | null;
  isPaid: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [exp, setExp] = useState<string>(expiresAt ?? "");

  return (
    <div className="flex items-end gap-3 shrink-0">
      {isPaid && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Scadenza</label>
          <Input
            type="date"
            value={exp}
            onChange={(e) => setExp(e.target.value)}
            onBlur={() => {
              if (exp !== (expiresAt ?? "")) {
                startTransition(async () => {
                  const r = await toggleClientModuleAction(clientId, moduleKey, enabled, exp || null);
                  if (r.ok) toast.success("Aggiornato");
                });
              }
            }}
            className="w-40"
          />
        </div>
      )}
      <Switch
        checked={enabled}
        disabled={pending}
        onCheckedChange={(v) =>
          startTransition(async () => {
            const r = await toggleClientModuleAction(clientId, moduleKey, v, exp || null);
            if (r.ok) toast.success(v ? "Attivato" : "Disattivato");
          })
        }
      />
    </div>
  );
}
