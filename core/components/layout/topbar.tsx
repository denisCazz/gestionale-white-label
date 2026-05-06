"use client";

import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import { Button } from "@core/components/ui/button";
import { LogOut, User, Globe } from "lucide-react";
import { logoutAction, switchLocaleAction } from "./actions";

export function Topbar({
  userName,
  userEmail,
  userRole,
  currentLocale,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  currentLocale: string;
}) {
  const tc = useTranslations("common");

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3">
      <div className="flex-1" />
      <form action={switchLocaleAction}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="uppercase text-xs">{currentLocale}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Lingua / Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button name="locale" value="it" type="submit" className="w-full text-left">
                Italiano
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button name="locale" value="en" type="submit" className="w-full text-left">
                English
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-sm">{userName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
              <span className="text-[10px] uppercase mt-1 text-primary">{userRole}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logoutAction} className="w-full">
              <button type="submit" className="flex items-center gap-2 w-full">
                <LogOut className="h-4 w-4" /> {tc("logout")}
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
