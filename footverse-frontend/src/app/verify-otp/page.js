"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { SubmitButton, Alert } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";

const LEN = 6;

function VerifyInner() {
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const email = sp.get("email") || "";

  const [digits, setDigits] = useState(Array(LEN).fill(""));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  // Countdown for OTP expiry
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  // No email in URL → back to register
  useEffect(() => { if (!email) router.replace("/register"); }, [email, router]);

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const setDigit = (i, val) => {
    const v = val.replace(/\D/g, "");
    if (!v) { setDigits((d) => { const n = [...d]; n[i] = ""; return n; }); return; }
    setDigits((d) => {
      const n = [...d];
      // handle paste of full code
      if (v.length > 1) {
        for (let k = 0; k < LEN; k++) n[k] = v[k] || "";
        return n;
      }
      n[i] = v[0];
      return n;
    });
    if (v.length === 1 && i < LEN - 1) refs.current[i + 1]?.focus();
    if (v.length > 1) refs.current[Math.min(v.length, LEN) - 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError(""); setNotice("");
    const otp = digits.join("");
    if (otp.length !== LEN) return setError("Please enter the 6-digit code.");
    if (secondsLeft <= 0) return setError("Code expired. Please resend a new one.");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      router.push("/login?registered=1");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(""); setNotice("");
    try {
      await resendOtp(email);
      setNotice("A new code has been sent to your email.");
      setSecondsLeft(5 * 60);
      setCooldown(30);
      setDigits(Array(LEN).fill(""));
      refs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code.");
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={<Link href="/register" className="font-semibold text-[#A5793A] hover:underline">← Back to sign up</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex justify-between gap-2" onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/^\d{4,6}$/.test(t.trim())) { e.preventDefault(); setDigit(0, t.trim()); } }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-14 w-full rounded-xl border border-[#33231A]/15 bg-white text-center text-xl font-semibold text-[#33231A] outline-none transition-colors focus:border-[#A5793A]"
            />
          ))}
        </div>

        <p className="text-center text-[13px] text-[#6E655C]">
          {secondsLeft > 0 ? <>Code expires in <span className="font-semibold text-[#33231A]">{mmss}</span></> : <span className="text-[#B8352C]">Code expired.</span>}
        </p>

        {notice && <Alert type="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}

        <SubmitButton loading={loading}>Verify</SubmitButton>

        <p className="text-center text-sm text-[#6E655C]">
          Didn&apos;t get it?{" "}
          <button type="button" onClick={resend} disabled={cooldown > 0} className="font-semibold text-[#A5793A] hover:underline disabled:opacity-50 disabled:no-underline">
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F4EF] text-[#6E655C]">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}