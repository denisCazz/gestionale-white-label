"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  useEffect(() => {
    if (state.error) toast.error(t("loginError"));
    if (state.redirectTo) {
      router.push(next ?? state.redirectTo);
      router.refresh();
    }
  }, [state, router, t, next]);

  return (
    <form action={formAction} className="space-y-4">
      {initialError && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {t("loginError")}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{tc("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{tc("password")}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {t("loginButton")}
      </Button>
    </form>
  );
}
