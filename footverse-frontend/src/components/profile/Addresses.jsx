"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, Field, Btn, Alert, EmptyState } from "./parts";

const EMPTY = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "", isDefault: false };

export default function Addresses() {
  const { getAddresses, addAddress, updateAddress, deleteAddress } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAddresses().then(setList).catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); setError(""); };
  const openEdit = (a) => { setForm({ ...a }); setEditing(a._id); setError(""); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setError("");
    if (!form.name || !form.line1 || !form.city || String(form.pin).length !== 6)
      return setError("Name, address, city and a 6-digit PIN are required.");
    setSaving(true);
    try {
      const next = editing === "new" ? await addAddress(form) : await updateAddress(editing, form);
      setList(next);
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try { setList(await deleteAddress(id)); } catch {}
  };

  if (loading) return <Card><p className="py-8 text-center text-sm text-[#6E655C]">Loading addresses…</p></Card>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#A5793A]">Saved Addresses</h3>
        {editing === null && <Btn variant="outline" onClick={openNew}>+ Add New</Btn>}
      </div>

      {editing !== null && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label (Home/Work)" value={form.label} onChange={set("label")} />
            <Field label="Full Name" value={form.name} onChange={set("name")} />
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
            <Field label="PIN Code" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0,6) })} />
            <div className="sm:col-span-2"><Field label="Address Line 1" value={form.line1} onChange={set("line1")} /></div>
            <div className="sm:col-span-2"><Field label="Address Line 2 (optional)" value={form.line2} onChange={set("line2")} /></div>
            <Field label="City" value={form.city} onChange={set("city")} />
            <Field label="State" value={form.state} onChange={set("state")} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[#33231A]">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-[#A5793A]" />
            Set as default address
          </label>
          {error && <div className="mt-4"><Alert>{error}</Alert></div>}
          <div className="mt-5 flex gap-3">
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Address"}</Btn>
            <Btn variant="outline" onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {editing === null && (list.length === 0 ? (
        <Card><EmptyState icon="📍" title="No addresses yet" sub="Add an address for faster checkout." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <Card key={a._id}>
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-[#F1ECE2] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6E655C]">{a.label}</span>
                {a.isDefault && <span className="text-[11px] font-semibold text-[#A5793A]">Default</span>}
              </div>
              <p className="mt-3 text-sm font-semibold text-[#33231A]">{a.name} · {a.phone}</p>
              <p className="mt-1 text-sm text-[#6E655C]">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.state} — {a.pin}</p>
              <div className="mt-4 flex gap-3 text-[13px] font-semibold">
                <button onClick={() => openEdit(a)} className="text-[#A5793A] hover:underline">Edit</button>
                <button onClick={() => remove(a._id)} className="text-[#B8352C] hover:underline">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}