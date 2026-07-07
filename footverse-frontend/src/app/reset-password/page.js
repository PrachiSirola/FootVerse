"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { PasswordField, SubmitButton, Alert } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";

function ResetInner() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const email = sp.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const invalid = !token || !email;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await resetPassword(email, token, password);
      router.push("/login?reset=1");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle={invalid ? "This reset link looks incomplete." : `Resetting password for ${email}.`}
      footer={<Link href="/login" className="font-semibold text-[#A5793A] hover:underline">← Back to login</Link>}
    >
      {invalid ? (
        <Alert>This reset link is invalid or missing information. Please request a new one from the Forgot Password page.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <PasswordField label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoFocus />
          <PasswordField label="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
          {error && <Alert>{error}</Alert>}
          <SubmitButton loading={loading}>Reset password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F4EF] text-[#6E655C]">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}