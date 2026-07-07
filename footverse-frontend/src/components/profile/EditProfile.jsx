"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, Field, Btn, Alert } from "./parts";

export default function EditProfile() {
  const { user, update } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setMsg(""); setError("");
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    setSaving(true);
    try {
      await update({ name: form.name.trim(), phone: form.phone.replace(/\D/g, "").slice(0, 10) });
      setMsg("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h3 className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#A5793A]">Edit Profile</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" value={form.name} onChange={set("name")} placeholder="Your name" />
        <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="10-digit number" />
        <div className="sm:col-span-2">
          <Field label="Email (cannot be changed)" value={user?.email || ""} disabled />
        </div>
      </div>
      {msg && <div className="mt-4"><Alert type="success">{msg}</Alert></div>}
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      <div className="mt-6">
        <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
      </div>
    </Card>
  );
}