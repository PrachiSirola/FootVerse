"use client";

import { useEffect, useState } from "react";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import ProfileDetails from "@/components/profile/ProfileDetails";
import EditProfile from "@/components/profile/EditProfile";
import Addresses from "@/components/profile/Addresses";
import ChangePassword from "@/components/profile/ChangePassword";
import { Card, EmptyState } from "@/components/profile/parts";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "edit", label: "Edit Profile" },
  { id: "orders", label: "My Orders", href: "/orders" },
  { id: "wishlist", label: "Wishlist", href: "/wishlist" },
  { id: "addresses", label: "Saved Addresses" },
  { id: "coupons", label: "Coupons" },
  { id: "notifications", label: "Notifications" },
  { id: "password", label: "Change Password" },
];

export default function ProfilePage() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("profile");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <>
        <Navbar />
        <ProfileSkeleton />
        <Footer />
      </>
    );
  }
  if (!user) return null;

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push("/login");
  };

  const content = {
    profile: <ProfileDetails />,
    edit: <EditProfile />,
    addresses: <Addresses />,
    password: <ChangePassword />,
    coupons: <Card><EmptyState icon="🎟️" title="No coupons yet" sub="Your available offers and promo codes will appear here." /></Card>,
    notifications: <Card><EmptyState icon="🔔" title="You're all caught up" sub="Order updates and offers will show up here." /></Card>,
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1300px] px-5 py-10 sm:px-8">
        <h1 className="font-sans-serif text-4xl font-bold text-[#33231A]">My Account</h1>
        <p className="mt-1 text-sm text-[#6E655C]">Manage your profile, orders, and preferences.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl bg-white p-4 shadow-[0_8px_28px_-18px_rgba(51,35,26,0.3)] lg:sticky lg:top-6">
            <nav className="space-y-1">
              {TABS.map((t) =>
                t.href ? (
                  <Link key={t.id} href={t.href}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-[#33231A] transition-colors hover:bg-[#F1ECE2]">
                    {t.label} <span className="text-[#6E655C]">→</span>
                  </Link>
                ) : (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${tab === t.id ? "bg-[#33231A] text-white" : "text-[#33231A] hover:bg-[#F1ECE2]"}`}>
                    {t.label}
                  </button>
                )
              )}
              <button onClick={() => setShowLogoutConfirm(true)}
                className="mt-2 block w-full rounded-xl border border-[#B8352C]/30 px-4 py-3 text-left text-sm font-semibold text-[#B8352C] transition-colors hover:bg-[#B8352C]/5">
                Logout
              </button>
            </nav>
          </aside>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}>
                {content[tab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#33231A]">Log out?</h3>
              <p className="mt-2 text-sm text-[#6E655C]">
                Are you sure you want to log out of your account?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-xl border border-[#33231A]/15 px-4 py-2 text-sm font-medium text-[#33231A] transition-colors hover:bg-[#F1ECE2]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="rounded-xl bg-[#B8352C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9c2c25]"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}