"use client";

import { useEffect, useState } from "react";
import { OrderListSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { getOrders } from "@/lib/order";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 h-8 w-48 fv-skeleton rounded" />
        <OrderListSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Failed to load orders
        </h1>

        <p className="mt-3 text-gray-500">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <h1 className="text-3xl font-bold">
          No Orders Yet
        </h1>

        <p className="mt-3 text-gray-500">
          You haven't placed any orders.
        </p>

        <Link
          href="/"
          className="inline-block mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">

      <h1 className="text-4xl font-bold mb-8">
        My Orders
      </h1>

      <div className="space-y-6">

        {orders.map((order) => (

          <div
            key={order._id}
            className="bg-white rounded-xl border shadow-sm p-6"
          >

            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-xl font-bold">
                  {order.orderNumber}
                </h2>

                <p className="text-gray-500 mt-2">
                  {new Date(order.createdAt).toLocaleString()}
                </p>

              </div>

              <div className="text-right">

                <h3 className="text-2xl font-bold">
                  ${Number(order.grandTotal).toFixed(2)}
                </h3>

                <p className="text-green-600 font-semibold">
                  {order.paymentStatus}
                </p>

              </div>

            </div>

            <div className="flex justify-between items-center mt-8">

              <div>

                <p>
                  <strong>Status:</strong> {order.orderStatus}
                </p>

              </div>

              <Link
                href={`/orders/${order._id}`}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
              >
                View Details
              </Link>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}