"use client";

import { Home, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AppHeader({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="border-b border-border/70 bg-[color:var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-display text-xl tracking-tight text-foreground"
          >
            HomeSpace
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink
              href="/properties"
              active={pathname.startsWith("/properties")}
            >
              <Home className="h-4 w-4" />
              Properties
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userName ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userName}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
