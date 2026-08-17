"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertLeaveType, archiveLeaveType } from "@/lib/actions/settings";
import { initialActionState } from "@/lib/actions/types";

type LeaveType = { id: string; name: string; color: string; countsAgainstAllowance: boolean };

const BLANK: LeaveType = { id: "", name: "", color: "#2563eb", countsAgainstAllowance: true };

export function LeaveTypeEditor({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [state, formAction, pending] = useActionState(upsertLeaveType, initialActionState);
  const [archivePending, startArchive] = useTransition();
  const router = useRouter();

  const current = leaveTypes.find((lt) => lt.id === selectedId) ?? BLANK;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Counts against allowance</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {leaveTypes.map((lt) => (
            <tr key={lt.id} className="border-b border-border last:border-0">
              <td className="py-2">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: lt.color }} />
                {lt.name}
              </td>
              <td className="py-2">{lt.countsAgainstAllowance ? "Yes" : "No"}</td>
              <td className="py-2 text-right">
                <button type="button" onClick={() => setSelectedId(lt.id)} className="mr-3 text-brand hover:underline">
                  Edit
                </button>
                <button
                  type="button"
                  disabled={archivePending}
                  onClick={() => startArchive(async () => { await archiveLeaveType(lt.id); router.refresh(); })}
                  className="text-red-600 hover:underline disabled:opacity-60"
                >
                  Archive
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-sm font-medium">{selectedId ? `Editing "${current.name}"` : "Add a leave type"}</p>
        <input type="hidden" name="id" value={selectedId} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-name" className="text-xs font-medium text-muted">
              Name
            </label>
            <input
              id="lt-name"
              name="name"
              key={`name-${selectedId}`}
              defaultValue={current.name}
              required
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-color" className="text-xs font-medium text-muted">
              Colour
            </label>
            <input
              id="lt-color"
              name="color"
              type="color"
              key={`color-${selectedId}`}
              defaultValue={current.color}
              className="h-9 w-14 rounded-md border border-border bg-surface"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="countsAgainstAllowance"
              key={`counts-${selectedId}`}
              defaultChecked={current.countsAgainstAllowance}
              className="rounded border-border"
            />
            Counts against allowance
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Saving…" : selectedId ? "Save" : "Add"}
          </button>
          {selectedId && (
            <button type="button" onClick={() => setSelectedId("")} className="pb-2 text-sm text-muted hover:underline">
              Cancel
            </button>
          )}
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
