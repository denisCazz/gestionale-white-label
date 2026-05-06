import { redirect, notFound } from "next/navigation";
import { auth } from "./auth";
import { getTenantBySlug, type TenantContext } from "./tenant";
import { tenantPrisma, type TenantPrisma } from "./tenant-prisma";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  clientId: string | null;
  role: Role;
  enabledModules: string[];
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/login");
  return user;
}

export type TenantSession = {
  user: SessionUser;
  tenant: TenantContext;
  db: TenantPrisma;
};

export async function requireTenant(slug: string): Promise<TenantSession> {
  const user = await requireUser();
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  if (!isSuperAdmin && user.clientId !== tenant.id) {
    redirect("/login");
  }

  return { user, tenant, db: tenantPrisma(tenant.id) };
}

export async function requireModule(slug: string, moduleKey: string): Promise<TenantSession> {
  const ctx = await requireTenant(slug);
  if (!ctx.tenant.enabledModules.includes(moduleKey) && ctx.user.role !== "SUPER_ADMIN") {
    redirect(`/t/${slug}/upgrade?module=${moduleKey}`);
  }
  return ctx;
}

export function requireRole(user: SessionUser, ...roles: Role[]) {
  if (!roles.includes(user.role) && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
}

export function isModuleEnabled(tenant: TenantContext, key: string): boolean {
  return tenant.enabledModules.includes(key);
}
