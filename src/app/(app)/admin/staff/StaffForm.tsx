"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createStaffMember, updateStaffMember } from "@/lib/actions/staff";
import { initialActionState } from "@/lib/actions/types";

type Existing = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  startDate: string; // yyyy-MM-dd
  annualAllowanceDays: number;
  active: boolean;
};

export function StaffForm({ existing }: { existing?: Existing }) {
  const action = existing ? updateStaffMember : createStaffMember;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && !existing) router.push("/admin/staff");
  }, [state.success, existing, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={existing?.name}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={existing?.email}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={existing?.role ?? "STAFF"}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={existing?.startDate}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="annualAllowanceDays" className="text-sm font-medium">
          Annual allowance (days)
        </label>
        <input
          id="annualAllowanceDays"
          name="annualAllowanceDays"
          type="number"
          step="0.5"
          min="0"
          required
          defaultValue={existing?.annualAllowanceDays ?? 28}
          className="w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {existing && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={existing.active} className="rounded border-border" />
          Active (unchecked = can no longer sign in)
        </label>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && existing && <p className="text-sm text-emerald-700">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : existing ? "Save changes" : "Create staff account"}
      </button>
    </form>
  );
}
