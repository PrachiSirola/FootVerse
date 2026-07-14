"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Field, PasswordField, SubmitButton, Alert } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";

function LoginInner() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const notice = sp.get("reason") === "checkout"
    ? "Please log in to continue with your purchase."
    : sp.get("registered") ? "Account verified! Please log in."
    : sp.get("reset") ? "Password updated! Please log in."
    : "";
  const redirectTo = sp.get("redirect") || "/";

  // already-logged-in guard: don't show /login to a signed-in user.
  useEffect(() => {
    if (!ready || !user) return;
    const explicit = sp.get("redirect");
    router.replace(explicit || (user.isAdmin ? "/admin" : "/"));
  }, [ready, user, sp, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (!password) return setError("Please enter your password.");
    setLoading(true);
    try {
      const loggedIn = await login(email, password);

      // Admins land on the dashboard by default. An explicit ?redirect= still
      // wins (e.g. they clicked a product link before being asked to log in).
      const explicitRedirect = sp.get("redirect");
      if (explicitRedirect) {
        router.push(explicitRedirect);
      } else if (loggedIn?.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Welcome back! Please enter your details."
      footer={<>Don&apos;t have an account? <Link href="/register" className="font-semibold text-[#A5793A] hover:underline">Sign up for free</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {notice && <Alert type="success">{notice}</Alert>}
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoFocus />
        <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] font-semibold text-[#33231A] hover:text-[#A5793A]">Forgot password</Link>
        </div>
        {error && <Alert>{error}</Alert>}
        <SubmitButton loading={loading}>Login</SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F4EF] text-[#6E655C]">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}