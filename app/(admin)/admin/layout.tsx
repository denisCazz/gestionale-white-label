import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Boxes, Users, LayoutDashboard, LogOut } from "lucide-react";
import { auth } from "@core/lib/auth";
import { logoutAction } from "@core/components/layout/actions";
import { Button } from "@core/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/login");

  const items = [
    { href: "/admin/clients", label: "Clienti", icon: Building2 },
    { href: "/admin/modules", label: "Moduli", icon: Boxes },
    { href: "/admin/users", label: "Utenti", icon: Users },
  ];

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <div className="px-6 py-5 border-b flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            S
          </div>
          <div>
            <p className="font-semibold">Super-Admin</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="p-3 border-t">
          <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Esci
          </Button>
        </form>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
