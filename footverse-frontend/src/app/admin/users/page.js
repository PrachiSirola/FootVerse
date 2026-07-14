"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUsers } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Table, Td, Badge, Empty, Pager } from "@/components/admin/ui";

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getUsers({ q, page, limit: 25 })
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, page]);

  return (
    <>
      <PageHeader title="Users" subtitle={data ? `${data.total} registered` : ""} />

      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setPage(1); }}
        placeholder="Search by name or email…"
        className="mb-4 w-full max-w-md rounded-lg border border-[#33231A]/12 bg-white px-3.5 py-2.5 text-[13px] focus:border-[#A5793A] focus:outline-none"
      />

      {loading ? (
        <Spinner label="Loading users…" />
      ) : !data || data.users.length === 0 ? (
        <Empty>No users found.</Empty>
      ) : (
        <>
          <Table head={["Name", "Email", "Orders", "Total Spend", "Wallet", "Status", "Joined"]}>
            {data.users.map((u) => (
              <tr key={u._id} className="hover:bg-[#F7F4EF]">
                <Td>
                  <Link href={`/admin/users/${u._id}`} className="font-semibold hover:text-[#A5793A]">
                    {u.name}
                  </Link>
                  {u.isAdmin && <span className="ml-2 text-[10px] font-bold uppercase text-[#A5793A]">Admin</span>}
                </Td>
                <Td className="text-[#6E655C]">{u.email}</Td>
                <Td>{u.orderCount}</Td>
                <Td className="font-semibold">{usd(u.totalSpend)}</Td>
                <Td>{usd(u.wallet?.balance || 0)}</Td>
                <Td><Badge>{u.isVerified ? "Paid" : "Pending"}</Badge></Td>
                <Td className="text-[#6E655C]">{new Date(u.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}