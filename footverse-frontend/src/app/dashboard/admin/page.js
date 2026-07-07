"use client";
import { useState } from "react";
import Link from "next/link";
import { orders, products, rfqs, formatPrice } from "@/data/placeholder";

const tabs = ["Orders", "Products", "RFQs"];
const statusColor = { Pending: "bg-yellow-100 text-yellow-700", Processing: "bg-blue-100 text-blue-700", Shipped: "bg-purple-100 text-purple-700", Delivered: "bg-green-100 text-green-700", Quoted: "bg-brand-100 text-brand-700" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("Orders");

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage orders and products</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/supplier" className="text-sm text-brand-700 font-medium border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors">Supplier View</Link>
          <Link href="/dashboard/corporate" className="text-sm text-brand-700 font-medium border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors">Corporate View</Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ["Total Orders", orders.length, "📦"],
          ["Revenue", formatPrice(orders.reduce((s, o) => s + o.total, 0)), "💰"],
          ["Products", products.length, "🪑"],
          ["Open RFQs", rfqs.filter((r) => r.status === "Pending").length, "📋"],
        ].map(([label, val, icon]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{icon} {label}</p>
            <p className="text-xl font-bold text-gray-900">{val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-brand-700 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {tab === "Orders" && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Order ID</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-medium text-brand-700"><Link href={`/orders/${o.id}`}>{o.id}</Link></td>
                  <td className="px-5 py-3 text-gray-800">{o.customer}</td>
                  <td className="px-5 py-3 text-gray-600">{o.items}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status}</span></td>
                  <td className="px-5 py-3 text-gray-400">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Products table */}
      {tab === "Products" && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors">+ Add Product</button>
          </div>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Supplier</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-gray-400">{p.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{p.category}</td>
                    <td className="px-5 py-3 text-gray-900">{formatPrice(p.price)}</td>
                    <td className="px-5 py-3 text-gray-600">{p.supplier}</td>
                    <td className="px-5 py-3 text-gray-600">★ {p.rating}</td>
                    <td className="px-5 py-3 flex gap-2">
                      <button className="text-brand-700 hover:text-brand-800 text-xs font-medium">Edit</button>
                      <button className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RFQs table */}
      {tab === "RFQs" && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">RFQ ID</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfqs.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-medium text-brand-700">{r.id}</td>
                  <td className="px-5 py-3 text-gray-800">{r.company}</td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{r.items}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span></td>
                  <td className="px-5 py-3 text-gray-400">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}