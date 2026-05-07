"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Package,
  BellRing,
  Sparkles,
  Truck,
  ShieldCheck,
  BarChart3,
  Settings,
  LayoutDashboard,
  Users,
  Lock,
  Store,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@core/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@core/components/ui/sheet";
import { Button } from "@core/components/ui/button";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  Store,
  BellRing,
  Sparkles,
  Truck,
  ShieldCheck,
  BarChart3,
  Settings,
  Users,
};

export type NavItem = {
  href: string;
  labelKey: string;
  icon: string;
  moduleKey?: string;
  enabled: boolean;
};

function NavLinks({
  items,
  basePath,
  brandName,
  logoUrl,
}: {
  items: NavItem[];
  basePath: string;
  brandName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  return (
    <>
      <div className="px-6 py-5 border-b flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            {brandName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">{brandName}</p>
          <p className="text-xs text-muted-foreground truncate">Gestionale</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? Package;
          const href = `${basePath}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const isLocked = !item.enabled;
          return (
            <Link
              key={item.href}
              href={
                isLocked
                  ? `${basePath}/upgrade?module=${item.moduleKey}`
                  : href
              }
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isLocked && "opacity-60"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{tNav(item.labelKey)}</span>
              {isLocked && <Lock className="h-3 w-3" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({
  items,
  brandName,
  logoUrl,
  basePath,
}: {
  items: NavItem[];
  brandName: string;
  logoUrl?: string | null;
  basePath: string;
}) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <NavLinks items={items} basePath={basePath} brandName={brandName} logoUrl={logoUrl} />
      </aside>

      {/* Mobile trigger (hamburger button shown in topbar via portal) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-3 left-3 z-40"
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col h-full pt-8">
              <NavLinks items={items} basePath={basePath} brandName={brandName} logoUrl={logoUrl} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
