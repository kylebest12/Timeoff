import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { LeaveTypeEditor } from "./LeaveTypeEditor";
import { HolidaysPanel } from "./HolidaysPanel";

export default async function AdminSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const params = await searchParams;
  const year = typeof params.year === "string" ? parseInt(params.year, 10) : new Date().getFullYear();

  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const leaveTypes = await prisma.leaveType.findMany({ where: { archived: false }, orderBy: { name: "asc" } });
  const holidays = await prisma.publicHoliday.findMany({
    where: { date: { gte: new Date(Date.UTC(year, 0, 1)), lte: new Date(Date.UTC(year, 11, 31)) } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Leave policy</h2>
        <SettingsForm carryoverMaxDays={settings.carryoverMaxDays} trackingStartYear={settings.trackingStartYear} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Leave types</h2>
        <LeaveTypeEditor leaveTypes={leaveTypes} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted">Public holidays</h2>
        <HolidaysPanel year={year} holidays={holidays} />
      </section>
    </div>
  );
}
