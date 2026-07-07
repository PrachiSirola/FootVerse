"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { Field, SubmitButton, Alert } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<Link href="/login" className="font-semibold text-[#A5793A] hover:underline">← Back to login</Link>}
    >
      {sent ? (
        <Alert type="success">
          If an account exists for {email}, a reset link is on its way. Check your inbox (and spam).
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
          {error && <Alert>{error}</Alert>}
          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}