/**
 * Northern Ireland bank holidays. NI has 10 (vs 8 in England & Wales): it adds
 * St Patrick's Day and Battle of the Boyne / Orangemen's Day, and observes Good Friday.
 * Fixed-date holidays that land on a weekend are substituted to the next free weekday,
 * resolved in date order so Christmas/Boxing Day never collide.
 */

export type ComputedHoliday = { date: Date; name: string };

function easterSunday(year: number): Date {
  // Meeus/Jones/Butcher Gregorian algorithm.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function dayOfWeek(date: Date): number {
  return date.getUTCDay(); // 0 = Sunday .. 6 = Saturday
}

function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, occurrence: "first" | "last"): Date {
  if (occurrence === "first") {
    for (let day = 1; day <= 7; day++) {
      const d = new Date(Date.UTC(year, monthIndex, day));
      if (dayOfWeek(d) === weekday) return d;
    }
  } else {
    const lastOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));
    for (let day = lastOfMonth.getUTCDate(); day >= lastOfMonth.getUTCDate() - 6; day--) {
      const d = new Date(Date.UTC(year, monthIndex, day));
      if (dayOfWeek(d) === weekday) return d;
    }
  }
  throw new Error("unreachable");
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Resolve fixed-date holidays landing on a weekend to the next free weekday, in date order. */
function resolveWeekendSubstitutes(entries: { date: Date; name: string }[]): ComputedHoliday[] {
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const used = new Set<string>();
  const resolved: ComputedHoliday[] = [];

  for (const entry of sorted) {
    let date = entry.date;
    if (dayOfWeek(date) === 0 || dayOfWeek(date) === 6) {
      do {
        date = addDays(date, 1);
      } while (dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || used.has(dateKey(date)));
    }
    used.add(dateKey(date));
    resolved.push({ date, name: entry.name });
  }

  return resolved.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function niHolidaysForYear(year: number): ComputedHoliday[] {
  const easter = easterSunday(year);
  const goodFriday = addDays(easter, -2);
  const easterMonday = addDays(easter, 1);
  const earlyMayBankHoliday = nthWeekdayOfMonth(year, 4, 1, "first"); // May, Monday
  const springBankHoliday = nthWeekdayOfMonth(year, 4, 1, "last");
  const summerBankHoliday = nthWeekdayOfMonth(year, 7, 1, "last"); // August, Monday

  const fixedDate = [
    { date: new Date(Date.UTC(year, 0, 1)), name: "New Year's Day" },
    { date: new Date(Date.UTC(year, 2, 17)), name: "St Patrick's Day" },
    { date: new Date(Date.UTC(year, 6, 12)), name: "Battle of the Boyne (Orangemen's Day)" },
    { date: new Date(Date.UTC(year, 11, 25)), name: "Christmas Day" },
    { date: new Date(Date.UTC(year, 11, 26)), name: "Boxing Day" },
  ];

  const movableAndMonthly: ComputedHoliday[] = [
    { date: goodFriday, name: "Good Friday" },
    { date: easterMonday, name: "Easter Monday" },
    { date: earlyMayBankHoliday, name: "Early May Bank Holiday" },
    { date: springBankHoliday, name: "Spring Bank Holiday" },
    { date: summerBankHoliday, name: "Summer Bank Holiday" },
  ];

  return [...resolveWeekendSubstitutes(fixedDate), ...movableAndMonthly].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export function niHolidaysForYears(startYear: number, endYear: number): ComputedHoliday[] {
  const holidays: ComputedHoliday[] = [];
  for (let year = startYear; year <= endYear; year++) {
    holidays.push(...niHolidaysForYear(year));
  }
  return holidays;
}
