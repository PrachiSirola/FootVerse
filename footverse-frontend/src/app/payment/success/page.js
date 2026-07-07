"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No Stripe session found.");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("fv-token") : null;

        const base =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const response = await fetch(
          `${base}/api/payments/session/${sessionId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        setOrder(data.order);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Verifying your payment...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-red-600">
          Payment Verification Failed
        </h1>

        <p className="mt-3">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-10">

        <div className="text-center">

          <div className="text-6xl mb-5">
            ✅
          </div>

          <h1 className="text-4xl font-bold">
            Payment Successful
          </h1>

          <p className="text-gray-500 mt-3">
            Thank you for your purchase.
          </p>

        </div>

        <div className="mt-10 space-y-4">

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold">
              Order Number
            </span>

            <span>
              {order?.orderNumber}
            </span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold">
              Payment Status
            </span>

            <span className="text-green-600 font-bold">
              {order?.paymentStatus}
            </span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold">
              Order Status
            </span>

            <span>
              {order?.orderStatus}
            </span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold">
              Amount Paid
            </span>

            <span className="font-semibold">
              ${Number(order?.grandTotal || 0).toFixed(2)}
            </span>
          </div>

        </div>

        <div className="flex gap-4 mt-10">

          <Link
            href="/orders"
            className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl"
          >
            View Orders
          </Link>

          <Link
            href="/"
            className="flex-1 border text-center py-3 rounded-xl"
          >
            Continue Shopping
          </Link>

        </div>

      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto py-24 text-center">Verifying payment…</div>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}