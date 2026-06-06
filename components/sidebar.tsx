"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth";

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
    <aside className="w-52 shrink-0 border-r border-gray-200 flex flex-col h-full">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 shrink-0">
        <span className="text-sm font-semibold tracking-tight">LLM Gateway</span>
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
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-2 border-t border-gray-200 shrink-0">
        {user && (
          <div className="px-3 py-1.5 mb-1">
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
