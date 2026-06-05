"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/logs", label: "Logs" },
  { href: "/playground", label: "Playground" },
  { href: "/api-keys", label: "API Keys" },
];

export function Sidebar() {
  const pathname = usePathname();

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
    </aside>
  );
}
