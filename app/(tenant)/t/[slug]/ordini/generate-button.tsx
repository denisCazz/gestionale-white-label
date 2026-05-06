"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@core/components/ui/button";
import { generateOrdersFromLowStock } from "@core/modules/supplier-orders/actions";

export function GenerateButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          const r = await generateOrdersFromLowStock(slug);
          if (r.ok) toast.success(`${r.created} ordini creati`);
        })
      }
      disabled={pending}
    >
      <Sparkles className={pending ? "animate-spin" : ""} />
      Genera da sottoscorta
    </Button>
  );
}
