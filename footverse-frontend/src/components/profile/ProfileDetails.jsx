"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, Alert } from "./parts";

function Avatar({ user, onUpload, uploading }) {
  const initial = (user?.name?.[0] || "U").toUpperCase();
  return (
    <div className="relative">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#A5793A]/15">
        {user?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-sans text-3xl font-bold text-[#A5793A]">{initial}</span>
        )}
      </div>
      <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#33231A] text-white shadow-md transition-colors hover:bg-[#4A3526]" title="Change photo">
        {uploading ? (
          <span className="text-[10px]">…</span>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </label>
    </div>
  );
}

export default function ProfileDetails() {
  const { user, updateAvatar } = useAuth();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > 2 * 1024 * 1024) return setError("Image must be under 2MB.");
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        await updateAvatar(reader.result);
      } catch (err) {
        setError(err.response?.data?.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const created = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <Avatar user={user} onUpload={onUpload} uploading={uploading} />
          <div className="text-center sm:text-left">
            <h2 className="font-sans text-2xl font-bold capitalize text-[#33231A]">{user?.name}</h2>
            <p className="text-sm text-[#6E655C]">{user?.email}</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${user?.isVerified ? "bg-[#2F7C4A]/12 text-[#2F7C4A]" : "bg-[#A5793A]/12 text-[#A5793A]"}`}>
              {user?.isVerified ? "✓ Verified" : "Unverified"}
            </span>
          </div>
        </div>
        {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      </Card>

      <Card>
        <h3 className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#A5793A]">Account Details</h3>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {[
            ["Full Name", user?.name],
            ["Email", user?.email],
            ["Phone", user?.phone || "Not added"],
            ["Member Since", created],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-[#6E655C]">{k}</dt>
              <dd className="mt-0.5 text-[15px] text-[#33231A]">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}