import { prisma } from "@/lib/prisma";
import { LeaveRequestForm } from "./LeaveRequestForm";

export default async function NewRequestPage() {
  const leaveTypes = await prisma.leaveType.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Request leave</h1>
      <LeaveRequestForm leaveTypes={leaveTypes} />
    </div>
  );
}
