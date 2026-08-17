import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { ApprovalRow } from "./ApprovalRow";

export default async function AdminPage() {
  const pending = await prisma.leaveRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: true, leaveType: true },
  });
  const recent = await prisma.leaveRequest.findMany({
    where: { status: { in: ["APPROVED", "DECLINED"] } },
    orderBy: { decidedAt: "desc" },
    take: 10,
    include: { user: true, leaveType: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Approvals</h1>

      <section className="rounded-lg border border-border bg-surface">
        {pending.length === 0 ? (
          <p className="p-4 text-sm text-muted">No pending requests.</p>
        ) : (
          pending.map((r) => <ApprovalRow key={r.id} request={r} />)
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Recent decisions</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-2 font-medium">Staff</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Dates</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No decisions yet.
                  </td>
                </tr>
              )}
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{r.user.name}</td>
                  <td className="px-4 py-3">{r.leaveType.name}</td>
                  <td className="px-4 py-3">
                    {format(r.startDate, "d MMM yyyy")} – {format(r.endDate, "d MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
