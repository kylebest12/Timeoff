"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { addPublicHoliday, generateHolidaysForYear, removePublicHoliday } from "@/lib/actions/settings";
import { initialActionState } from "@/lib/actions/types";

type Holiday = { id: string; date: Date; name: string };

export function HolidaysPanel({ year, holidays }: { year: number; holidays: Holiday[] }) {
  const router = useRouter();
  const [addState, addAction, addPending] = useActionState(addPublicHoliday, initialActionState);
  const [genPending, startGenerate] = useTransition();
  const [removePending, startRemove] = useTransition();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href={`/admin/settings?year=${year - 1}`} className="rounded-md border border-border px-2 py-1 text-sm hover:bg-background">
            ← {year - 1}
          </a>
          <span className="text-sm font-medium">{year}</span>
          <a href={`/admin/settings?year=${year + 1}`} className="rounded-md border border-border px-2 py-1 text-sm hover:bg-background">
            {year + 1} →
          </a>
        </div>
        <button
          type="button"
          disabled={genPending}
          onClick={() => startGenerate(async () => { await generateHolidaysForYear(year); router.refresh(); })}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background disabled:opacity-60"
        >
          {genPending ? "Generating…" : `Generate NI holidays for ${year}`}
        </button>
      </div>

      <ul className="flex flex-col gap-1">
        {holidays.length === 0 && <li className="text-sm text-muted">No holidays for {year} yet.</li>}
        {holidays.map((h) => (
          <li key={h.id} className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0">
            <span>
              {format(h.date, "EEE d MMM yyyy")} — {h.name}
            </span>
            <button
              type="button"
              disabled={removePending}
              onClick={() => startRemove(async () => { await removePublicHoliday(h.id); router.refresh(); })}
              className="text-red-600 hover:underline disabled:opacity-60"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form action={addAction} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-xs font-medium text-muted">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="holiday-name" className="text-xs font-medium text-muted">
            Name
          </label>
          <input
            id="holiday-name"
            name="name"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          type="submit"
          disabled={addPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
        >
          {addPending ? "Adding…" : "Add holiday"}
        </button>
        {addState.error && <p className="text-sm text-red-600">{addState.error}</p>}
      </form>
    </div>
  );
}
