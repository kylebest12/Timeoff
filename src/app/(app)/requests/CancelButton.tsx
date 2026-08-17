"use client";

import { useTransition } from "react";
import { cancelLeaveRequest } from "@/lib/actions/leave-requests";

export function CancelButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await cancelLeaveRequest(requestId); })}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-60"
    >
      {pending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
