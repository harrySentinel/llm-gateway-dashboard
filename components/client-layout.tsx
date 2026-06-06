"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

const NO_SIDEBAR = ["/", "/login", "/signup"];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);
  const [open, setOpen] = useState(false);

  if (!showSidebar) return <>{children}</>;

  return (
    <div className="flex h-full overflow-hidden bg-background">

      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/[0.07] shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-500 flex items-center justify-center">
              <span className="text-[9px] font-bold text-black">G</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              LLM Gateway
            </span>
          </div>
        </div>

        {/* Free beta banner */}
        <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-400">
          <span className="text-base">🎉</span>
          <span>
            <strong>Free while in beta</strong> — explore every feature at no cost.
            Pricing will be introduced later.
          </span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
          <div className="min-h-full p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
