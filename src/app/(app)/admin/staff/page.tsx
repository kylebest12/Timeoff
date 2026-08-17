import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserYearSummary, type YearSummary } from "@/lib/balance";

export default async function StaffListPage() {
  const year = new Date().getFullYear();
  const staff = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const summaries: YearSummary[] = [];
  for (const u of staff) {
    summaries.push(await getUserYearSummary(u.id, year));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff</h1>
        <Link
          href="/admin/staff/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark"
        >
          Add staff
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Remaining ({year})</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {staff.map((u, i) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{summaries[i].remaining}</td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="text-emerald-700">Active</span>
                  ) : (
                    <span className="text-muted">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/staff/${u.id}`} className="text-brand hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
