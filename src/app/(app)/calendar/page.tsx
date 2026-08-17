import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { prisma } from "@/lib/prisma";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const anchor = monthParam ? parse(monthParam, "yyyy-MM", new Date()) : new Date();

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const holidays = await prisma.publicHoliday.findMany({ where: { date: { gte: gridStart, lte: gridEnd } } });
  const requests = await prisma.leaveRequest.findMany({
    where: { status: "APPROVED", startDate: { lte: gridEnd }, endDate: { gte: gridStart } },
    include: { user: true, leaveType: true },
  });

  const holidayByDay = new Map(holidays.map((h) => [format(h.date, "yyyy-MM-dd"), h.name]));

  function requestsOnDay(day: Date) {
    return requests.filter((r) => r.startDate <= day && r.endDate >= day);
  }

  const prevMonth = format(addMonths(anchor, -1), "yyyy-MM");
  const nextMonth = format(addMonths(anchor, 1), "yyyy-MM");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{format(anchor, "MMMM yyyy")}</h1>
        <div className="flex items-center gap-2">
          <Link href={`/calendar?month=${prevMonth}`} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background">
            ← Prev
          </Link>
          <Link href="/calendar" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background">
            Today
          </Link>
          <Link href={`/calendar?month=${nextMonth}`} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background">
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-surface px-2 py-1.5 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const holidayName = holidayByDay.get(key);
          const dayRequests = requestsOnDay(day);
          return (
            <div
              key={key}
              className={`min-h-24 bg-surface p-1.5 ${isSameMonth(day, anchor) ? "" : "opacity-40"}`}
            >
              <div className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${isToday(day) ? "bg-brand text-brand-foreground" : "text-muted"}`}>
                {format(day, "d")}
              </div>
              {holidayName && (
                <div className="mb-1 truncate rounded bg-amber-100 px-1 py-0.5 text-[11px] text-amber-800" title={holidayName}>
                  {holidayName}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {dayRequests.map((r) => (
                  <div
                    key={r.id}
                    className="truncate rounded px-1 py-0.5 text-[11px] text-white"
                    style={{ backgroundColor: r.leaveType.color }}
                    title={`${r.user.name} — ${r.leaveType.name}`}
                  >
                    {r.user.name.split(" ")[0]}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
