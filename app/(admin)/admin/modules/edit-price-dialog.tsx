"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@core/components/ui/dialog";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { updateModulePriceAction } from "./actions";

interface EditPriceDialogProps {
  moduleKey: string;
  moduleName: string;
  currentPriceMonthly: number | null;
  currentPriceOneTime: number | null;
}

export function EditPriceDialog({ moduleKey, moduleName, currentPriceMonthly, currentPriceOneTime }: EditPriceDialogProps) {
  const [open, setOpen] = useState(false);
  const [monthly, setMonthly] = useState(currentPriceMonthly !== null ? String(currentPriceMonthly) : "");
  const [oneTime, setOneTime] = useState(currentPriceOneTime !== null ? String(currentPriceOneTime) : "");
  const [isPending, startTransition] = useTransition();

  function parsePrice(val: string): number | null {
    if (val.trim() === "") return null;
    const n = parseFloat(val.replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function handleSave() {
    startTransition(async () => {
      await updateModulePriceAction(moduleKey, parsePrice(monthly), parsePrice(oneTime));
      setOpen(false);
    });
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifica prezzi — {moduleName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="monthly">Abbonamento mensile (€/mese)</Label>
              <Input
                id="monthly"
                type="number"
                step="0.01"
                min="0"
                placeholder="es. 9.90"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onetime">Pagamento una tantum (€)</Label>
              <Input
                id="onetime"
                type="number"
                step="0.01"
                min="0"
                placeholder="es. 99.00"
                value={oneTime}
                onChange={(e) => setOneTime(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Lascia vuoto i campi che non vuoi mostrare.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvo..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
