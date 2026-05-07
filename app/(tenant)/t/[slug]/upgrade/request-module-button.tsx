"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { requestModuleAction } from "./actions";

export function RequestModuleButton({ slug, moduleKey, moduleName }: { slug: string; moduleKey: string; moduleName: string }) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRequest() {
    startTransition(async () => {
      const res = await requestModuleAction(slug, moduleKey);
      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        setSent(true);
        toast.success("Richiesta inviata! Ti contatteremo al più presto.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
        <CheckCircle className="h-5 w-5" />
        Richiesta inviata — ti contatteremo presto
      </div>
    );
  }

  return (
    <Button onClick={handleRequest} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Send className="h-4 w-4 mr-2" />
      )}
      Richiedi attivazione {moduleName}
    </Button>
  );
}
