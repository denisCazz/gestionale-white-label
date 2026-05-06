"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signOut } from "@core/lib/auth";

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}

export async function switchLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "it");
  if (!["it", "en"].includes(locale)) return;
  const c = await cookies();
  c.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
