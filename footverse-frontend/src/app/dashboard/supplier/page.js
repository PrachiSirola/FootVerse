"use client";
import Link from "next/link";
import { supplierStats, products, orders, formatPrice } from "@/data/placeholder";

export default function SupplierDashboard() {
  const myProducts = products.filter((p) => p.supplier === supplierStats.name);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{supplierStats.name} · Commission rate: {supplierStats.commissionRate}%</p>
        </div>
        <Link href="/dashboard/admin" className="text-sm text-brand-700 font-medium border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors">Admin View</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          ["Products Listed", supplierStats.productsListed, "📦"],
          ["Total Orders", supplierStats.totalOrders, "🛒"],
          ["Revenue", formatPrice(supplierStats.revenue), "💰"],
          ["Pending Orders", supplierStats.pendingOrders, "⏳"],
        ].map(([label, val, icon]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">{icon} {label}</p>
            <p className="text-xl font-bold text-gray-900">{val}</p>
          </div>
        ))}
      </div>

      {/* My products */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">My Products</h2>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Reviews</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-600 capitalize">{p.category}</td>
                <td className="px-5 py-3 text-gray-900">{formatPrice(p.price)}</td>
                <td className="px-5 py-3 text-gray-600">★ {p.rating}</td>
                <td className="px-5 py-3 text-gray-400">{p.reviews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent orders */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
            <tr><th className="px-5 py-3">Order ID</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.slice(0, 3).map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-brand-700">{o.id}</td>
                <td className="px-5 py-3 text-gray-800">{o.customer}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{formatPrice(o.total)}</td>
                <td className="px-5 py-3 text-gray-600">{o.status}</td>
                <td className="px-5 py-3 text-gray-400">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}