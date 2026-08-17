import { prisma } from "@/lib/prisma";

export type YearSummary = {
  year: number;
  proratedAllowance: number;
  carriedOver: number;
  used: number;
  remaining: number;
};

function utcDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function yearBounds(year: number) {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}

function daysInYear(year: number): number {
  return (Date.UTC(year, 11, 31) - Date.UTC(year, 0, 1)) / 86_400_000 + 1;
}

function clampRange(start: Date, end: Date, boundStart: Date, boundEnd: Date): { start: Date; end: Date } | null {
  const s = start < boundStart ? boundStart : start;
  const e = end > boundEnd ? boundEnd : end;
  if (s > e) return null;
  return { start: s, end: e };
}

/** Counts weekdays in [start, end] (inclusive) that aren't in holidayDates. */
export function countBusinessDays(start: Date, end: Date, holidayDates: Set<string>): number {
  let count = 0;
  const cursor = utcDate(start);
  const last = utcDate(end);
  while (cursor <= last) {
    const dow = cursor.getUTCDay();
    const key = cursor.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidayDates.has(key)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/** Pro-rates a user's annual allowance for the portion of `year` they were employed. */
export function proratedAllowanceForYear(
  annualAllowanceDays: number,
  startDate: Date,
  year: number,
): number {
  const { start: yearStart, end: yearEnd } = yearBounds(year);
  const employmentStart = utcDate(startDate);
  if (employmentStart > yearEnd) return 0;
  if (employmentStart <= yearStart) return annualAllowanceDays;

  const daysEmployed = (yearEnd.getTime() - employmentStart.getTime()) / 86_400_000 + 1;
  const ratio = daysEmployed / daysInYear(year);
  return Math.round(annualAllowanceDays * ratio * 2) / 2; // round to nearest half day
}

type RequestLike = {
  startDate: Date;
  endDate: Date;
  status: string;
  leaveType: { countsAgainstAllowance: boolean };
};

function usedDaysInYear(requests: RequestLike[], year: number, holidayDates: Set<string>): number {
  const { start: yearStart, end: yearEnd } = yearBounds(year);
  let total = 0;
  for (const req of requests) {
    if (req.status !== "APPROVED" || !req.leaveType.countsAgainstAllowance) continue;
    const clamped = clampRange(utcDate(req.startDate), utcDate(req.endDate), yearStart, yearEnd);
    if (!clamped) continue;
    total += countBusinessDays(clamped.start, clamped.end, holidayDates);
  }
  return total;
}

/**
 * Computes allowance/used/carryover for every year from the org's tracking-start
 * year up to `targetYear`, so carryover (capped at settings.carryoverMaxDays) can
 * cascade forward year over year without a scheduled rollover job.
 */
export async function getUserYearSummary(userId: string, targetYear: number): Promise<YearSummary> {
  // Queried sequentially, not with Promise.all: concurrent queries on the shared
  // PrismaClient/pg.Pool have been unreliable in dev (protocol-level errors from
  // overlapping queries), so this app never issues concurrent queries on one client.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const requests = await prisma.leaveRequest.findMany({
    where: { userId, status: "APPROVED" },
    include: { leaveType: true },
  });
  const holidays = await prisma.publicHoliday.findMany();

  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const startYear = Math.min(settings.trackingStartYear, targetYear);

  let carriedOver = 0;
  let summary: YearSummary = { year: startYear, proratedAllowance: 0, carriedOver: 0, used: 0, remaining: 0 };

  for (let year = startYear; year <= targetYear; year++) {
    const allowance = proratedAllowanceForYear(user.annualAllowanceDays, user.startDate, year);
    const used = usedDaysInYear(requests, year, holidayDates);
    const remaining = Math.max(0, allowance + carriedOver - used);
    summary = { year, proratedAllowance: allowance, carriedOver, used, remaining };
    carriedOver = Math.min(settings.carryoverMaxDays, remaining);
  }

  return summary;
}
