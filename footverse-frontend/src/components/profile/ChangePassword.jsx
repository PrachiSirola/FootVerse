"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, Btn, Alert } from "./parts";

function PwField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#33231A]">{label}</span>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={onChange}
          className="w-full rounded-xl border border-[#33231A]/15 bg-white px-4 py-3 pr-11 text-sm text-[#33231A] outline-none focus:border-[#A5793A]" />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E655C] hover:text-[#33231A]">
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </label>
  );
}

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);

  const submit = async () => {
    setMsg(""); setError("");
    if (f.next.length < 6) return setError("New password must be at least 6 characters.");
    if (f.next !== f.confirm) return setError("New passwords do not match.");
    setSaving(true);
    try {
      await changePassword(f.current, f.next);
      setMsg("Password changed successfully.");
      setF({ current: "", next: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password.");
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <h3 className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#A5793A]">Change Password</h3>
      <div className="max-w-md space-y-4">
        <PwField label="Current Password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
        <PwField label="New Password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
        <PwField label="Confirm New Password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
        {msg && <Alert type="success">{msg}</Alert>}
        {error && <Alert>{error}</Alert>}
        <Btn onClick={submit} disabled={saving}>{saving ? "Updating…" : "Update Password"}</Btn>
      </div>
    </Card>
  );
}