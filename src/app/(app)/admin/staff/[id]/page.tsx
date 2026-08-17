import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { StaffForm } from "../StaffForm";
import { ResetPasswordButton } from "./ResetPasswordButton";

export default async function EditStaffPage({ params }: PageProps<"/admin/staff/[id]">) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{user.name}</h1>
        <ResetPasswordButton userId={user.id} />
      </div>
      <StaffForm
        existing={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          startDate: format(user.startDate, "yyyy-MM-dd"),
          annualAllowanceDays: user.annualAllowanceDays,
          active: user.active,
        }}
      />
    </div>
  );
}
