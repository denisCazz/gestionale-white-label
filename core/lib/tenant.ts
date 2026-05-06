import { cache } from "react";
import { prisma } from "./prisma";
import { hexToHsl } from "./utils";

export type TenantBranding = {
  primaryHsl: string;
  secondaryHsl: string;
};

export type TenantContext = {
  id: string;
  slug: string;
  ragioneSociale: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  locale: string;
  currency: string;
  active: boolean;
  branding: TenantBranding;
  enabledModules: string[];
};

export const getTenantBySlug = cache(async (slug: string): Promise<TenantContext | null> => {
  const client = await prisma.client.findUnique({
    where: { slug },
    include: {
      modules: {
        where: { enabled: true },
        select: { moduleKey: true, expiresAt: true },
      },
    },
  });

  if (!client || !client.active) return null;

  const now = new Date();
  const enabledModules = client.modules
    .filter((m) => !m.expiresAt || m.expiresAt > now)
    .map((m) => m.moduleKey);

  return {
    id: client.id,
    slug: client.slug,
    ragioneSociale: client.ragioneSociale,
    logoUrl: client.logoUrl,
    primaryColor: client.primaryColor,
    secondaryColor: client.secondaryColor,
    locale: client.locale,
    currency: client.currency,
    active: client.active,
    branding: {
      primaryHsl: hexToHsl(client.primaryColor),
      secondaryHsl: hexToHsl(client.secondaryColor),
    },
    enabledModules,
  };
});

export function tenantStyleVars(tenant: TenantContext): React.CSSProperties {
  return {
    ["--primary" as string]: tenant.branding.primaryHsl,
    ["--ring" as string]: tenant.branding.primaryHsl,
  } as React.CSSProperties;
}
