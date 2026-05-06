"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@core/components/ui/button";
import { runScanAction } from "@core/modules/low-stock-alerts/actions";

export function ScanButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          const r = await runScanAction(slug);
          const totals = r.summary.reduce(
            (acc, s) => ({ created: acc.created + s.created, resolved: acc.resolved + s.resolved }),
            { created: 0, resolved: 0 }
          );
          toast.success(`Scan completato: ${totals.created} nuovi, ${totals.resolved} risolti`);
        });
      }}
      disabled={pending}
      variant="outline"
    >
      <RefreshCw className={pending ? "animate-spin" : ""} />
      Esegui scan
    </Button>
  );
}
