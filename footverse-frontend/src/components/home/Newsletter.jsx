"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-4 sm:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-[#33231A] to-[#4A3526] px-6 py-14 text-center text-white sm:px-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#D9B87A]">Stay in step</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">Join the FootVerse</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
          New drops, member-only prices and size restocks — straight to your inbox. No spam, ever.
        </p>
        {done ? (
          <p className="mt-7 text-[15px] font-medium text-[#D9B87A]">✓ You&apos;re on the list. Welcome aboard!</p>
        ) : (
          <div className="mx-auto mt-7 flex max-w-md gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email.includes("@") && setDone(true)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#D9B87A]"
            />
            <button
              type="button"
              onClick={() => email.includes("@") && setDone(true)}
              className="shrink-0 rounded-xl bg-[#A5793A] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B98A48]"
            >
              Subscribe
            </button>
          </div>
        )}
      </div>
    </section>
  );
}