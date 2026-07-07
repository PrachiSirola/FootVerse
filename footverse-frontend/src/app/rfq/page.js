"use client";
import { useState } from "react";
import Link from "next/link";

export default function RFQPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: "", contact: "", email: "", phone: "",
    category: "desks", items: "", qty: "", budget: "", notes: "",
  });
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const fieldClass = "w-full border border-gray-300 rounded-lg text-sm px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none";

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">RFQ Submitted</h1>
        <p className="text-gray-500 text-sm mb-1">Reference: <span className="font-mono font-medium text-gray-800">RFQ-203</span></p>
        <p className="text-gray-400 text-sm mb-8">Our team will review your request and send a quote to {form.email || "your email"} within 2 business days.</p>
        <Link href="/" className="inline-flex bg-brand-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-800 text-sm transition-colors">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link><span>/</span>
        <span className="text-gray-700 font-medium">Request for Quote</span>
      </nav>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Request a Quote</h1>
        <p className="text-sm text-gray-400 mb-6">Need furniture in bulk? Fill in the details and we'll get back with competitive pricing.</p>

        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Company Name" value={form.company} onChange={update("company")} className={fieldClass} />
            <input required placeholder="Contact Person" value={form.contact} onChange={update("contact")} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Email" type="email" value={form.email} onChange={update("email")} className={fieldClass} />
            <input required placeholder="Phone" value={form.phone} onChange={update("phone")} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select value={form.category} onChange={update("category")} className={fieldClass}>
                <option value="desks">Desks</option>
                <option value="chairs">Chairs</option>
                <option value="storage">Storage</option>
                <option value="mixed">Mixed / Multiple</option>
              </select>
            </div>
            <input required placeholder="Approx. Quantity" value={form.qty} onChange={update("qty")} className={fieldClass} />
          </div>
          <input placeholder="Product Names or IDs (if known)" value={form.items} onChange={update("items")} className={fieldClass} />
          <input placeholder="Budget Range (optional)" value={form.budget} onChange={update("budget")} className={fieldClass} />
          <textarea rows={3} placeholder="Additional requirements, customization, or delivery notes…" value={form.notes} onChange={update("notes")} className={fieldClass} />
          <button type="submit" className="w-full bg-brand-700 text-white font-semibold py-3 rounded-lg hover:bg-brand-800 transition-colors text-sm">
            Submit RFQ
          </button>
        </form>
      </div>
    </div>
  );
}