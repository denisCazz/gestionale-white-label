"use client";

import { useTransition } from "react";
import { Send, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@core/components/ui/button";
import { sendOrderEmail, markOrderReceived } from "@core/modules/supplier-orders/actions";

export function OrderActions({
  slug,
  orderId,
  status,
  canSend,
}: {
  slug: string;
  orderId: string;
  status: string;
  canSend: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-1">
      {status === "DRAFT" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !canSend}
          title={canSend ? "" : "Fornitore senza email"}
          onClick={() =>
            startTransition(async () => {
              const r = await sendOrderEmail(slug, orderId);
              if (r.ok) toast.success("Inviato");
              else toast.error(r.error);
            })
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
      {(status === "SENT" || status === "CONFIRMED" || status === "DRAFT") && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await markOrderReceived(slug, orderId);
              if (r.ok) toast.success("Ricevuto");
              else toast.error(r.error);
            })
          }
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
