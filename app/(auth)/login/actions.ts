"use server";

import { signIn } from "@core/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@core/lib/prisma";

export type LoginState = { error?: string; redirectTo?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn(
      "credentials",
      {
        email,
        password,
        redirect: false,
      } as Parameters<typeof signIn>[1]
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "invalid" };
    }
    return { error: "invalid" };
  }

  // Determina il redirect in base all'utente trovato
  const u = await prisma.user.findFirst({
    where: { email },
    select: { role: true, client: { select: { slug: true } } },
  });

  if (u?.role === "SUPER_ADMIN" && !u.client) {
    return { redirectTo: "/admin/clients" };
  }
  if (u?.client?.slug) {
    return { redirectTo: `/t/${u.client.slug}/dashboard` };
  }
  return { redirectTo: "/admin/clients" };
}
