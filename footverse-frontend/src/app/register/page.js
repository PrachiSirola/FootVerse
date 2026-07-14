"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { Field, PasswordField, SubmitButton, Alert } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register, user, ready } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", adminSecretCode: "" });

  // already-logged-in guard: a signed-in user shouldn't see /register.
  useEffect(() => {
    if (!ready || !user) return;
    router.replace(user.isAdmin ? "/admin" : "/");
  }, [ready, user, router]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!form.email.includes("@")) return setError("Please enter a valid email.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password, form.adminSecretCode.trim());
      // OTP sent — go verify. Pass email via query.
      router.push(`/verify-otp?email=${encodeURIComponent(form.email.toLowerCase().trim())}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not register. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create an account"
      subtitle="Join FootVerse — your universe of footwear."
      footer={<>Have an account? <Link href="/login" className="font-semibold text-[#A5793A] hover:underline">Log in here</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full Name" value={form.name} onChange={set("name")} placeholder="Your name" autoFocus />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
        <PasswordField label="Password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
        <PasswordField label="Confirm Password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" />

        {/* Optional — only staff have this code. Validated on the server. */}
        <PasswordField
          label="Admin Secret Code (optional)"
          value={form.adminSecretCode}
          onChange={set("adminSecretCode")}
          placeholder="Leave blank unless you're staff"
        />
        {error && <Alert>{error}</Alert>}
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}