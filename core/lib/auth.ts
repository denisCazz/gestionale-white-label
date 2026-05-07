import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      clientId: string | null;
      role: Role;
      enabledModules: string[];
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  clientSlug: z.string().optional().nullable(),
});

async function loadEnabledModules(clientId: string): Promise<string[]> {
  const now = new Date();
  const cms = await prisma.clientModule.findMany({
    where: {
      clientId,
      enabled: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { moduleKey: true },
  });
  return cms.map((m) => m.moduleKey);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        clientSlug: { label: "Tenant", type: "text" },
      },
      authorize: async (raw) => {
        const normalized = { ...(raw as Record<string, unknown>) };
        const cs = normalized.clientSlug;
        if (cs === undefined || cs === null || String(cs).trim() === "" || String(cs) === "undefined") {
          delete normalized.clientSlug;
        }

        const parsed = credentialsSchema.safeParse(normalized);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Cerca l'utente per email — ogni utente è legato ad una sola azienda
        const user = await prisma.user.findFirst({
          where: { email: email.toLowerCase(), active: true },
        });
        if (!user) return null;

        // Verifica che il client sia attivo (se l'utente appartiene ad un tenant)
        if (user.clientId) {
          const c = await prisma.client.findUnique({
            where: { id: user.clientId },
            select: { active: true },
          });
          if (!c || !c.active) return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const enabledModules = user.clientId ? await loadEnabledModules(user.clientId) : [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          clientId: user.clientId,
          role: user.role,
          enabledModules,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const t = token as Record<string, unknown>;
      if (user) {
        const u = user as unknown as {
          id: string;
          clientId: string | null;
          role: Role;
          enabledModules: string[];
        };
        t.id = u.id;
        t.clientId = u.clientId;
        t.role = u.role;
        t.enabledModules = u.enabledModules;
        t.moduleRefreshAt = Date.now() + 5 * 60_000;
      }

      const refreshAt = typeof t.moduleRefreshAt === "number" ? t.moduleRefreshAt : 0;
      const needsRefresh = trigger === "update" || (refreshAt > 0 && Date.now() > refreshAt);
      if (needsRefresh && typeof t.clientId === "string") {
        t.enabledModules = await loadEnabledModules(t.clientId);
        t.moduleRefreshAt = Date.now() + 5 * 60_000;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as Record<string, unknown>;
      if (token && session.user) {
        session.user.id = (t.id as string) ?? "";
        session.user.clientId = (t.clientId as string | null) ?? null;
        session.user.role = (t.role as Role) ?? "STAFF";
        session.user.enabledModules = (t.enabledModules as string[]) ?? [];
      }
      return session;
    },
  },
});

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
