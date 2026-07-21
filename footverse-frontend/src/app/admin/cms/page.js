"use client";

import { useEffect, useState } from "react";
import { getHero, updateHero } from "@/lib/admin";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Empty } from "@/components/admin/ui";

export default function AdminCms() {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getHero()
      .then((r) => setHero(r.hero))
      .catch(() => setHero(null))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const r = await updateHero(hero);
      setHero(r.hero);
      setMsg("Saved — the storefront hero is updated.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner fullPage label="Loading banner…" />;
  if (!hero) return <Empty>Could not load the hero banner.</Empty>;

  const set = (k) => (e) => setHero({ ...hero, [k]: e.target.value });

  return (
    <>
      <PageHeader
        title="Hero Banner"
        subtitle="Edit the homepage hero — image, text and buttons — without touching code"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Editor */}
        <Card>
          <form onSubmit={save} className="space-y-3.5">
            <Field label="Image URL" value={hero.imageUrl} onChange={set("imageUrl")} placeholder="https://…" />
            <Field label="Eyebrow (small label)" value={hero.eyebrow} onChange={set("eyebrow")} />
            <Field label="Title" value={hero.title} onChange={set("title")} />
            <div>
              <label className="text-[12px] font-semibold text-[#6E655C]">Subtitle</label>
              <textarea
                value={hero.subtitle || ""}
                onChange={set("subtitle")}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[#33231A]/12 px-3 py-2 text-[13px] focus:border-[#A5793A] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Primary button text" value={hero.primaryCtaText} onChange={set("primaryCtaText")} />
              <Field label="Primary button link" value={hero.primaryCtaHref} onChange={set("primaryCtaHref")} />
              <Field label="Secondary button text" value={hero.secondaryCtaText} onChange={set("secondaryCtaText")} />
              <Field label="Secondary button link" value={hero.secondaryCtaHref} onChange={set("secondaryCtaHref")} />
            </div>

            <label className="flex items-center gap-2 text-[13px] text-[#33231A]">
              <input
                type="checkbox"
                checked={!!hero.active}
                onChange={(e) => setHero({ ...hero, active: e.target.checked })}
                className="h-4 w-4 accent-[#A5793A]"
              />
              Show this banner on the homepage
            </label>

            <button
              disabled={saving}
              className="w-full rounded-lg bg-[#33231A] py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save banner"}
            </button>
            {msg && <p className="text-[12px] text-[#6E655C]">{msg}</p>}
          </form>
        </Card>

        {/* Live preview — what the storefront will render */}
        <Card className="!p-0 overflow-hidden">
          <p className="border-b border-[#33231A]/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Preview
          </p>
          <div className="relative min-h-[280px] bg-[#F7F4EF]">
            {hero.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div className="relative flex min-h-[280px] flex-col justify-center bg-gradient-to-r from-[#F7F4EF] via-[#F7F4EF]/85 to-transparent p-8">
              {hero.eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A5793A]">
                  {hero.eyebrow}
                </p>
              )}
              <h2 className="mt-2 max-w-sm font-sans-serif text-3xl font-bold text-[#33231A]">
                {hero.title || "Your headline"}
              </h2>
              {hero.subtitle && (
                <p className="mt-2 max-w-sm text-[13px] text-[#6E655C]">{hero.subtitle}</p>
              )}
              <div className="mt-5 flex gap-3">
                {hero.primaryCtaText && (
                  <span className="rounded-xl bg-[#33231A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
                    {hero.primaryCtaText}
                  </span>
                )}
                {hero.secondaryCtaText && (
                  <span className="rounded-xl border-2 border-[#33231A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#33231A]">
                    {hero.secondaryCtaText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#6E655C]">{label}</label>
      <input
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-[#33231A]/12 px-3 py-2 text-[13px] focus:border-[#A5793A] focus:outline-none"
      />
    </div>
  );
}