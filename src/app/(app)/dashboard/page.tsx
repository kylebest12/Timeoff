import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserYearSummary } from "@/lib/balance";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const year = new Date().getFullYear();
  const summary = await getUserYearSummary(session.user.id, year);
  const upcoming = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id, status: "APPROVED", endDate: { gte: new Date() } },
    orderBy: { startDate: "asc" },
    take: 5,
    include: { leaveType: true },
  });
  const pending = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id, status: "PENDING" },
    orderBy: { startDate: "asc" },
    include: { leaveType: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome back, {session.user.name?.split(" ")[0]}</h1>
        <Link
          href="/requests/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark"
        >
          Request leave
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={`${year} Allowance`} value={summary.proratedAllowance} />
        <StatCard label="Carried over" value={summary.carriedOver} />
        <StatCard label="Used" value={summary.used} />
        <StatCard label="Remaining" value={summary.remaining} highlight />
      </div>

      {pending.length > 0 && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted">Awaiting approval</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span>
                  {r.leaveType.name}: {format(r.startDate, "d MMM yyyy")} – {format(r.endDate, "d MMM yyyy")}
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted">Upcoming approved leave</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Nothing booked yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span>
                  {r.leaveType.name}: {format(r.startDate, "d MMM yyyy")} – {format(r.endDate, "d MMM yyyy")}
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border border-border p-4 ${highlight ? "bg-brand text-brand-foreground" : "bg-surface"}`}>
      <p className={`text-xs font-medium ${highlight ? "text-brand-foreground/80" : "text-muted"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
