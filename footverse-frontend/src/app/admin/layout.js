"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/ui/Spinner";

/**
 * Admin shell — sidebar navigation + auth gate.
 * Every /admin route renders inside this. Non-admins are redirected out.
 *
 * The storefront is warm and editorial; the admin is the same palette held to a
 * tighter, denser grid — a working tool, not a showroom.
 */

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/returns", label: "Return Requests" },
  { href: "/admin/issues", label: "Customer Issues" },
  { href: "/admin/finance", label: "Commission & Finance" },
  { href: "/admin/cms", label: "Hero Banner" },
];

export default function AdminLayout({ children }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && (!user || !user.isAdmin)) router.replace("/login?redirect=/admin");
  }, [ready, user, router]);

  if (!ready) return <Spinner fullPage label="Checking access…" />;
  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#33231A]/10 bg-white lg:flex">
          <div className="border-b border-[#33231A]/10 px-6 py-5">
            <p className="font-sans-serif text-xl font-bold text-[#33231A]">FootVerse</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A5793A]">
              Admin
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-0.5 block rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-[#33231A] text-white"
                      : "text-[#6E655C] hover:bg-[#F1ECE2] hover:text-[#33231A]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[#33231A]/10 p-4">
            <p className="truncate text-[12px] font-semibold text-[#33231A]">{user.name}</p>
            <p className="truncate text-[11px] text-[#6E655C]">{user.email}</p>
            <Link
              href="/"
              className="mt-2 inline-block text-[12px] font-semibold text-[#A5793A] hover:underline"
            >
              ← Back to store
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="fixed inset-x-0 top-0 z-40 flex gap-1 overflow-x-auto border-b border-[#33231A]/10 bg-white px-3 py-2 lg:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium ${
                  active ? "bg-[#33231A] text-white" : "text-[#6E655C]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <main className="min-w-0 flex-1 px-5 pb-16 pt-16 lg:px-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}