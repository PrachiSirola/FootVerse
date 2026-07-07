"use client";
import Link from "next/link";
import { corporateStats, orders, rfqs, formatPrice } from "@/data/placeholder";

export default function CorporateDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corporate Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{corporateStats.company}</p>
        </div>
        <Link href="/rfq" className="text-sm text-white bg-brand-700 font-semibold px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors">New RFQ</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          ["Total Orders", corporateStats.totalOrders, "📦"],
          ["Total Spend", formatPrice(corporateStats.totalSpend), "💰"],
          ["Active RFQs", corporateStats.activeRFQs, "📋"],
          ["Saved Addresses", corporateStats.savedAddresses, "📍"],
        ].map(([label, val, icon]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{icon} {label}</p>
            <p className="text-xl font-bold text-gray-900">{val}</p>
          </div>
        ))}
      </div>

      {/* Order history */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Order History</h2>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
            <tr><th className="px-5 py-3">Order ID</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.slice(0, 3).map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-brand-700"><Link href={`/orders/${o.id}`}>{o.id}</Link></td>
                <td className="px-5 py-3 text-gray-600">{o.items}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{formatPrice(o.total)}</td>
                <td className="px-5 py-3 text-gray-600">{o.status}</td>
                <td className="px-5 py-3 text-gray-400">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RFQ status */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">My RFQs</h2>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
            <tr><th className="px-5 py-3">RFQ ID</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rfqs.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-brand-700">{r.id}</td>
                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{r.items}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{r.status}</span>
                </td>
                <td className="px-5 py-3 text-gray-400">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}