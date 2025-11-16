"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const tabs = [
  { href: "/app", label: "Overview", segment: null },
  { href: "/app/stores", label: "Stores", segment: "stores" },
  { href: "/app/analytics", label: "Analytics", segment: "analytics" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <h1 className="text-lg font-semibold">Searchier</h1>
          <nav className="flex gap-2 text-sm">
            {tabs.map((tab) => {
              const active =
                (segment === null && tab.segment === null) ||
                segment === tab.segment;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-full px-4 py-2 transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
