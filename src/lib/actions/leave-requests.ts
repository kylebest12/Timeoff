"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";
import type { ActionState } from "./types";

const requestSchema = z.object({
  leaveTypeId: z.string().min(1, "Choose a leave type."),
  startDate: z.string().min(1, "Choose a start date."),
  endDate: z.string().min(1, "Choose an end date."),
  reason: z.string().max(500).optional(),
});

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/admin");
  revalidatePath("/calendar");
}

export async function createLeaveRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "You must be signed in." };

  const parsed = requestSchema.safeParse({
    leaveTypeId: formData.get("leaveTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { leaveTypeId, reason } = parsed.data;
  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Please enter valid dates." };
  }
  if (end < start) {
    return { error: "End date must be on or after the start date." };
  }

  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlapping) {
    return { error: "You already have a request that overlaps these dates." };
  }

  const request = await prisma.leaveRequest.create({
    data: { userId: session.user.id, leaveTypeId, startDate: start, endDate: end, reason },
    include: { leaveType: true, user: true },
  });

  revalidateAll();

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
  await Promise.all(
    admins.map((admin) =>
      sendEmail(
        admin.email,
        `New leave request from ${request.user.name}`,
        `${request.user.name} requested ${request.leaveType.name} from ${start.toDateString()} to ${end.toDateString()}.` +
          (reason ? `\n\nReason: ${reason}` : "") +
          `\n\nReview it at ${process.env.AUTH_URL ?? ""}/admin`,
      ),
    ),
  );

  return { success: true };
}

export async function cancelLeaveRequest(requestId: string): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "You must be signed in." };

  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found." };

  const isOwner = request.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return { error: "You can't cancel this request." };
  if (request.status !== "PENDING") return { error: "Only pending requests can be cancelled." };

  await prisma.leaveRequest.update({ where: { id: requestId }, data: { status: "CANCELLED" } });
  revalidateAll();
  return { success: true };
}

export async function decideLeaveRequest(
  requestId: string,
  decision: "APPROVED" | "DECLINED",
  note?: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return { error: "Admin access required." };

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { user: true, leaveType: true },
  });
  if (!request) return { error: "Request not found." };
  if (request.status !== "PENDING") return { error: "This request has already been decided." };

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      decidedById: session.user.id,
      decidedAt: new Date(),
      decisionNote: note || null,
    },
  });

  revalidateAll();

  const verb = decision === "APPROVED" ? "approved" : "declined";
  await sendEmail(
    request.user.email,
    `Your leave request was ${verb}`,
    `Your ${request.leaveType.name} request (${request.startDate.toDateString()} – ${request.endDate.toDateString()}) was ${verb} by ${session.user.name}.` +
      (note ? `\n\nNote: ${note}` : ""),
  );

  return { success: true };
}
