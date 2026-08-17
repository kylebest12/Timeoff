"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { decideLeaveRequest } from "@/lib/actions/leave-requests";

type Request = {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  user: { name: string };
  leaveType: { name: string };
};

export function ApprovalRow({ request }: { request: Request }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "APPROVED" | "DECLINED") {
    startTransition(async () => {
      const result = await decideLeaveRequest(request.id, decision, note || undefined);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border p-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-medium">{request.user.name}</p>
        <p className="text-sm text-muted">
          {request.leaveType.name}: {format(request.startDate, "d MMM yyyy")} – {format(request.endDate, "d MMM yyyy")}
        </p>
        {request.reason && <p className="mt-1 text-sm text-muted">&ldquo;{request.reason}&rdquo;</p>}
      </div>
      <div className="flex flex-col gap-2 sm:w-64">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => decide("APPROVED")}
            disabled={pending}
            className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Approve
          </button>
          <button
            onClick={() => decide("DECLINED")}
            disabled={pending}
            className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
