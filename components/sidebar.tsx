"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  Terminal,
  KeyRound,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/overview",      label: "Overview",       icon: LayoutDashboard },
  { href: "/logs",          label: "Logs",           icon: ScrollText },
  { href: "/playground",    label: "Playground",     icon: Terminal },
  { href: "/api-keys",      label: "API Keys",       icon: KeyRound },
  { href: "/provider-keys", label: "Provider Keys",  icon: ShieldCheck },
];

interface SidebarProps { onClose?: () => void; }

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="
      w-56 shrink-0 flex flex-col h-full
      bg-white dark:bg-zinc-950
      border-r border-zinc-200 dark:border-white/[0.07]
    ">
      {/* Brand */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-black">G</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            LLM Gateway
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav label */}
      <div className="px-4 pt-4 pb-1">
        <p className="text-[10px] uppercase tracking-widest font-medium text-zinc-400 dark:text-zinc-600">
          Menu
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pb-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium"
                  : "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-zinc-200",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-500 rounded-r-full" />
              )}
              <Icon className={cn(
                "w-4 h-4 shrink-0",
                active ? "text-cyan-500" : "text-zinc-400 dark:text-zinc-600",
              )} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-zinc-200 dark:border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">{initial}</span>
          </div>
          <p className="text-xs text-zinc-400 truncate flex-1">{user?.email ?? "—"}</p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="flex flex-1 items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
