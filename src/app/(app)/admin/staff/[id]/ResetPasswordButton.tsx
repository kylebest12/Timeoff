"use client";

import { useState, useTransition } from "react";
import { resetStaffPassword } from "@/lib/actions/staff";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await resetStaffPassword(userId);
          setDone(true);
        })
      }
      disabled={pending}
      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background disabled:opacity-60"
    >
      {done ? "New password emailed" : pending ? "Resetting…" : "Reset password"}
    </button>
  );
}
