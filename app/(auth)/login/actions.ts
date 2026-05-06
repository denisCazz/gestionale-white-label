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
  const clientSlug = String(formData.get("clientSlug") ?? "").trim();

  try {
    // NB: NextAuth serializza il body con URLSearchParams → `undefined` diventa la stringa "undefined" (truthy) e rompe il login super-admin.
    await signIn(
      "credentials",
      {
        email,
        password,
        ...(clientSlug ? { clientSlug } : {}),
        redirect: false,
      } as Parameters<typeof signIn>[1]
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "invalid" };
    }
    return { error: "invalid" };
  }

  let redirectTo = "/admin/clients";
  if (clientSlug) {
    redirectTo = `/t/${clientSlug}/dashboard`;
  } else {
    const u = await prisma.user.findFirst({
      where: { email, clientId: null, role: "SUPER_ADMIN" },
      select: { id: true },
    });
    if (!u) {
      const anyUser = await prisma.user.findFirst({
        where: { email },
        select: { client: { select: { slug: true } } },
      });
      if (anyUser?.client?.slug) redirectTo = `/t/${anyUser.client.slug}/dashboard`;
    }
  }
  return { redirectTo };
}
