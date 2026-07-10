"use client";

import { useEffect, useState } from "react";
import { OrderListSkeleton } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminListReturns, adminResolveReturn, adminMarkRefunded } from "@/lib/order";
import Spinner from "@/components/ui/Spinner";
import { usd } from "@/lib/format";

export default function AdminReturnsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  // Admin gate.
  useEffect(() => {
    if (ready && (!user || !user.isAdmin)) router.replace("/");
  }, [ready, user, router]);

  async function load() {
    try {
      setOrders(await adminListReturns());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (ready && user?.isAdmin) load();
  }, [ready, user]);

  async function resolve(id, decision) {
    setBusyId(id);
    try {
      await adminResolveReturn(id, decision, decision === "Rejected" ? "Rejected by admin" : "Approved");
      await load();
    } finally {
      setBusyId("");
    }
  }
  async function refund(id) {
    setBusyId(id);
    try {
      await adminMarkRefunded(id, "Refund completed by admin");
      await load();
    } finally {
      setBusyId("");
    }
  }

  if (!ready || loading) return <div className="mx-auto max-w-6xl px-5 py-10"><OrderListSkeleton rows={4} /></div>;
  if (!user?.isAdmin) return null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-8 font-playfair text-3xl font-bold text-[#33231A]">
        Returns &amp; Cancellations
      </h1>

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-[#6E655C] shadow-sm">
          No returns or cancellations yet.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#33231A]">{o.orderNumber}</p>
                  <p className="text-[13px] text-[#6E655C]">
                    {o.paymentMethod} · {usd(o.grandTotal)} · {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#33231A]/8 px-3 py-1 text-[12px] font-semibold text-[#33231A]">
                    {o.orderStatus}
                  </span>
                  {o.returnRequest?.status !== "None" && (
                    <span className="rounded-full bg-[#A5793A]/12 px-3 py-1 text-[12px] font-semibold text-[#A5793A]">
                      Return: {o.returnRequest.status}
                    </span>
                  )}
                  {o.refund?.status !== "None" && (
                    <span className="rounded-full bg-[#6E655C]/12 px-3 py-1 text-[12px] font-semibold text-[#6E655C]">
                      Refund: {o.refund.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Cancellation info */}
              {o.orderStatus === "Cancelled" && o.cancellation?.reason && (
                <p className="mt-3 text-[13px] text-[#6E655C]">
                  <span className="font-semibold text-[#33231A]">Cancelled:</span> {o.cancellation.reason}
                  {o.cancellation.cancelledBy ? ` (by ${o.cancellation.cancelledBy})` : ""}
                </p>
              )}

              {/* Return info */}
              {o.returnRequest?.status !== "None" && (
                <div className="mt-3 rounded-lg bg-[#F1ECE2] p-3.5 text-[13px]">
                  <p><span className="font-semibold text-[#33231A]">Reason:</span> {o.returnRequest.reason}</p>
                  {o.returnRequest.comments && (
                    <p className="mt-1"><span className="font-semibold text-[#33231A]">Comments:</span> {o.returnRequest.comments}</p>
                  )}
                  {o.paymentMethod === "COD" && o.returnRequest.bankDetails && (
                    <p className="mt-1 text-[#6E655C]">
                      <span className="font-semibold text-[#33231A]">Refund to:</span>{" "}
                      {o.returnRequest.bankDetails.upiId
                        ? `UPI ${o.returnRequest.bankDetails.upiId}`
                        : `${o.returnRequest.bankDetails.accountName} · ${o.returnRequest.bankDetails.accountNumber} · ${o.returnRequest.bankDetails.ifsc}`}
                    </p>
                  )}
                </div>
              )}

              {/* Admin actions */}
              <div className="mt-4 flex flex-wrap gap-2.5">
                {o.returnRequest?.status === "Requested" && (
                  <>
                    <button
                      onClick={() => resolve(o._id, "Approved")}
                      disabled={busyId === o._id}
                      className="rounded-lg bg-[#33231A] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-white transition-colors hover:bg-[#4A3526] disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => resolve(o._id, "Rejected")}
                      disabled={busyId === o._id}
                      className="rounded-lg border-2 border-[#B8352C] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#B8352C] transition-colors hover:bg-[#B8352C] hover:text-white disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </>
                )}
                {["Pending", "Processing"].includes(o.refund?.status) && (
                  <button
                    onClick={() => refund(o._id)}
                    disabled={busyId === o._id}
                    className="rounded-lg border-2 border-[#A5793A] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#A5793A] transition-colors hover:bg-[#A5793A] hover:text-white disabled:opacity-60"
                  >
                    Mark Refunded
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}