"use client";

import { useState } from "react";

export function Field({ label, type = "text", value, onChange, placeholder, autoFocus, onKeyDown, name }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-[#33231A]">{label}</span>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-[#33231A]/15 bg-white px-4 py-3 text-sm text-[#33231A] outline-none transition-colors placeholder:text-[#6E655C]/50 focus:border-[#A5793A]"
      />
    </label>
  );
}

export function PasswordField({ label, value, onChange, placeholder = "Password", autoFocus, onKeyDown, name }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-[#33231A]">{label}</span>}
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-[#33231A]/15 bg-white px-4 py-3 pr-11 text-sm text-[#33231A] outline-none transition-colors placeholder:text-[#6E655C]/50 focus:border-[#A5793A]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E655C] hover:text-[#33231A]"
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
    </label>
  );
}

export function SubmitButton({ children, loading, disabled }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-xl bg-[#33231A] py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4A3526] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function Alert({ type = "error", children }) {
  if (!children) return null;
  const styles = type === "error"
    ? "bg-[#B8352C]/8 text-[#B8352C]"
    : "bg-[#2F7C4A]/10 text-[#2F7C4A]";
  return <div className={`rounded-lg px-3.5 py-2.5 text-[13px] ${styles}`}>{children}</div>;
}