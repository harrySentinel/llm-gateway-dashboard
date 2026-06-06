"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  Terminal,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/overview",  label: "Overview",   icon: LayoutDashboard },
  { href: "/logs",      label: "Logs",       icon: ScrollText },
  { href: "/playground",label: "Playground", icon: Terminal },
  { href: "/api-keys",  label: "API Keys",   icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full border-r border-border bg-background">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border shrink-0">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-primary-foreground">G</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">LLM Gateway</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
          Dashboard
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-border shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-primary-foreground">
              {initial}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate flex-1">
            {user?.email ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="flex flex-1 items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
