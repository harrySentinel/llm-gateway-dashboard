"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/logs", label: "Logs" },
  { href: "/playground", label: "Playground" },
  { href: "/api-keys", label: "API Keys" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="w-52 shrink-0 border-r border-border flex flex-col h-full bg-background">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          LLM Gateway
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: theme toggle + user + sign out */}
      <div className="p-2 border-t border-border shrink-0 space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          {user && (
            <p className="text-xs text-muted-foreground truncate flex-1 mr-2">
              {user.email}
            </p>
          )}
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
