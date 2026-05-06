"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@core/components/ui/button";
import { resolveAlert } from "@core/modules/low-stock-alerts/actions";

export function ResolveButton({ slug, id }: { slug: string; id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await resolveAlert(slug, id);
          toast.success("Risolto");
        })
      }
    >
      <Check className="h-4 w-4" />
      Risolvi
    </Button>
  );
}
