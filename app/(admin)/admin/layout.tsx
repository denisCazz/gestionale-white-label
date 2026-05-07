import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Boxes, Users, LogOut, Menu } from "lucide-react";
import { auth } from "@core/lib/auth";
import { logoutAction } from "@core/components/layout/actions";
import { Button } from "@core/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@core/components/ui/sheet";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/login");

  const items = [
    { href: "/admin/clients", label: "Clienti", icon: Building2 },
    { href: "/admin/modules", label: "Moduli", icon: Boxes },
    { href: "/admin/users", label: "Utenti", icon: Users },
  ];

  const NavContent = () => (
    <>
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
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
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
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 overflow-y-auto p-4 pt-14 md:pt-4 md:p-6">{children}</main>
    </div>
  );
}
