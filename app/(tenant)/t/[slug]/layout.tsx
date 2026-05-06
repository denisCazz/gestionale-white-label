import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@core/lib/auth";
import { getTenantBySlug, tenantStyleVars } from "@core/lib/tenant";
import { MODULES } from "@core/modules/registry";
import { Sidebar, type NavItem } from "@core/components/layout/sidebar";
import { Topbar } from "@core/components/layout/topbar";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?next=/t/${slug}/dashboard`);

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  if (session.user.role !== "SUPER_ADMIN" && session.user.clientId !== tenant.id) {
    redirect("/login");
  }

  const locale = await getLocale();
  const basePath = `/t/${slug}`;

  const items: NavItem[] = [
    { href: "/dashboard", labelKey: "dashboard", icon: "LayoutDashboard", enabled: true },
    ...MODULES.flatMap((m) =>
      m.routes.map((r) => ({
        href: r.path,
        labelKey: navKeyFor(m.key, r.path),
        icon: m.icon,
        moduleKey: m.key,
        enabled: !m.isPaid || tenant.enabledModules.includes(m.key),
      }))
    ),
    { href: "/settings", labelKey: "settings", icon: "Settings", enabled: true },
  ];

  return (
    <div className="flex h-screen" style={tenantStyleVars(tenant)}>
      <Sidebar items={items} brandName={tenant.ragioneSociale} logoUrl={tenant.logoUrl} basePath={basePath} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={session.user.name ?? session.user.email ?? "User"}
          userEmail={session.user.email ?? ""}
          userRole={session.user.role}
          currentLocale={locale}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function navKeyFor(moduleKey: string, path: string): string {
  if (moduleKey === "stock" && path === "/fornitori") return "suppliers";
  const map: Record<string, string> = {
    stock: "stock",
    "low-stock-alerts": "alerts",
    "ai-forecast": "forecast",
    "supplier-orders": "orders",
    haccp: "haccp",
    reports: "reports",
  };
  return map[moduleKey] ?? moduleKey;
}
