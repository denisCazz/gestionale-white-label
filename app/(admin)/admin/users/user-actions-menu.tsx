"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, KeyRound, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@core/components/ui/dialog";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { resetUserPasswordAction, deleteUserAction } from "./actions";

export function UserActionsMenu({ userId, userName }: { userId: string; userName: string }) {
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId, password);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Password aggiornata");
        setResetOpen(false);
        setPassword("");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Utente eliminato");
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Azioni</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRound className="h-4 w-4 mr-2" /> Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Elimina utente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <div className="space-y-4 p-2">
            <div>
              <h2 className="text-lg font-semibold">Reset password</h2>
              <p className="text-sm text-muted-foreground">Imposta una nuova password per <strong>{userName}</strong></p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimo 6 caratteri"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button onClick={handleReset} disabled={isPending || password.length < 6}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <div className="space-y-4 p-2">
            <div>
              <h2 className="text-lg font-semibold text-destructive">Elimina utente</h2>
              <p className="text-sm text-muted-foreground">
                Sei sicuro di voler eliminare <strong>{userName}</strong>? L&apos;operazione è irreversibile.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Annulla</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Elimina
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
