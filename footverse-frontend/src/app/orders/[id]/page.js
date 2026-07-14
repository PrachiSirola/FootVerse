"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrder, cancelOrder } from "@/lib/order";
import CancelModal from "@/components/orders/CancelModal";
import { useAuth } from "@/context/AuthContext";

const CANCELLABLE = ["Pending", "Confirmed", "Processing", "Packed"];

const steps = [
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
];

function currentStep(status) {
  switch (status) {
    case "Confirmed":
      return 0;
    case "Packed":
      return 1;
    case "Shipped":
      return 2;
    case "Delivered":
      return 3;
    default:
      return 0;
  }
}

export default function OrderDetailsPage() {
  const { id } = useParams();

  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [notice, setNotice] = useState("");


  async function reload() {
    const data = await getOrder(id);
    setOrder(data);
  }


  async function handleCancel(reason) {
    const res = await cancelOrder(id, reason);
    setShowCancel(false);
    setNotice(res.refundNote ? `Order cancelled. ${res.refundNote}` : "Order cancelled.");
    await reload();
  }


  useEffect(() => {
    async function load() {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-24">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">

        <h1 className="text-3xl font-bold">
          Order Not Found
        </h1>

        <Link
          href="/orders"
          className="text-blue-600"
        >
          Back
        </Link>

      </div>
    );
  }

  const step = currentStep(order.orderStatus);

  return (
    <div className="max-w-5xl mx-auto py-10 px-5">

      <h1 className="text-4xl font-bold mb-8">
        Order Details
      </h1>

      {notice && (
        <div className="mb-5 rounded-xl bg-[#A5793A]/10 px-4 py-3 text-sm text-[#33231A]">
          {notice}
        </div>
      )}

      {/* Cancel / Return actions */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {CANCELLABLE.includes(order.orderStatus) && (
          <button
            onClick={() => setShowCancel(true)}
            className="rounded-xl border-2 border-[#B8352C] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#B8352C] transition-colors hover:bg-[#B8352C] hover:text-white"
          >
            Cancel Order
          </button>
        )}
        {order.orderStatus === "Delivered" && (!order.returnRequest || order.returnRequest.status === "None") && (
          <Link
            href={`/returns/${id}`}
            className="rounded-xl border-2 border-[#33231A] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#33231A] transition-colors hover:bg-[#33231A] hover:text-white"
          >
            Request Return
          </Link>
        )}
        {order.orderStatus === "Cancelled" && (
          <span className="rounded-full bg-[#B8352C]/10 px-4 py-1.5 text-[13px] font-semibold text-[#B8352C]">
            Cancelled{order.cancellation?.reason ? ` — ${order.cancellation.reason}` : ""}
          </span>
        )}
        {order.returnRequest && order.returnRequest.status !== "None" && (
          <span className="rounded-full bg-[#A5793A]/10 px-4 py-1.5 text-[13px] font-semibold text-[#A5793A]">
            Return {order.returnRequest.status}
          </span>
        )}
        {order.refund && order.refund.status !== "None" && (
          <span className="rounded-full bg-[#33231A]/10 px-4 py-1.5 text-[13px] font-semibold text-[#33231A]">
            Refund {order.refund.status}
          </span>
        )}
      </div>


      {showCancel && (
        <CancelModal order={order} onClose={() => setShowCancel(false)} onConfirm={handleCancel} />
      )}


      <div className="bg-white rounded-xl shadow border p-6">

        <div className="flex justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              {order.orderNumber}
            </h2>

            <p className="text-gray-500 mt-2">
              {new Date(order.createdAt).toLocaleString()}
            </p>

          </div>

          <div className="text-right">

            <p className="text-2xl font-bold">
              ${Number(order.grandTotal).toFixed(2)}
            </p>

            <p className="text-green-600 font-semibold">
              {order.paymentStatus}
            </p>

          </div>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow border p-6 mt-8">

        <h2 className="font-bold text-xl mb-6">
          Order Progress
        </h2>

        <div className="flex justify-between">

          {steps.map((item, index) => (

            <div
              key={item}
              className="flex flex-col items-center flex-1"
            >

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  index <= step
                    ? "bg-green-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index < step ? "✓" : index + 1}
              </div>

              <p className="mt-3">
                {item}
              </p>

            </div>

          ))}

        </div>

      </div>

      <div className="bg-white rounded-xl shadow border p-6 mt-8">

        <h2 className="font-bold text-xl mb-5">
          Customer
        </h2>

        <p>
          <strong>Name:</strong> {order.customer.name}
        </p>

        <p>
          <strong>Email:</strong> {order.customer.email}
        </p>

        <p>
          <strong>Phone:</strong> {order.customer.phone}
        </p>

        <p className="mt-4">
          <strong>Address:</strong>
        </p>

        <p>{order.customer.address}</p>

        <p>
          {order.customer.city}, {order.customer.state}
        </p>

        <p>{order.customer.pin}</p>

      </div>

      <div className="bg-white rounded-xl shadow border p-6 mt-8">

        <h2 className="font-bold text-xl mb-5">
          Products
        </h2>

        {order.items.length === 0 ? (

          <p className="text-gray-500">
            No products saved yet.
          </p>

        ) : (

          order.items.map((item) => (

            <div
              key={item.productId}
              className="flex justify-between border-b py-4"
            >

              <div>

                <p className="font-semibold">
                  {item.name}
                </p>

                <p>
                  Qty: {item.quantity}
                </p>

              </div>

              <p>
                ${Number(item.subtotal).toFixed(2)}
              </p>

            </div>

          ))

        )}

      </div>

    </div>
  );
}