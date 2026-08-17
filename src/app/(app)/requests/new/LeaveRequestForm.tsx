"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createLeaveRequest } from "@/lib/actions/leave-requests";
import { initialActionState } from "@/lib/actions/types";

type LeaveType = { id: string; name: string };

export function LeaveRequestForm({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const [state, formAction, pending] = useActionState(createLeaveRequest, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.push("/requests");
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="leaveTypeId" className="text-sm font-medium">
          Leave type
        </label>
        <select
          id="leaveTypeId"
          name="leaveTypeId"
          required
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        >
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium">
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-sm font-medium">
          Note (optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
