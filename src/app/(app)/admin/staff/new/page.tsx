import { StaffForm } from "../StaffForm";

export default function NewStaffPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Add staff</h1>
      <p className="text-sm text-muted">
        A temporary password will be generated and emailed to them, along with a sign-in link.
      </p>
      <StaffForm />
    </div>
  );
}
