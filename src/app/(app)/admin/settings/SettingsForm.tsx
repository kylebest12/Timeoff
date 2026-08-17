"use client";

import { useActionState } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { initialActionState } from "@/lib/actions/types";

export function SettingsForm({ carryoverMaxDays, trackingStartYear }: { carryoverMaxDays: number; trackingStartYear: number }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="carryoverMaxDays" className="text-sm font-medium">
            Max carry-over days
          </label>
          <input
            id="carryoverMaxDays"
            name="carryoverMaxDays"
            type="number"
            step="0.5"
            min="0"
            defaultValue={carryoverMaxDays}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="trackingStartYear" className="text-sm font-medium">
            Tracking start year
          </label>
          <input
            id="trackingStartYear"
            name="trackingStartYear"
            type="number"
            defaultValue={trackingStartYear}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
