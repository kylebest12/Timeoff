"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { niHolidaysForYear } from "@/lib/holidays";
import type { ActionState } from "./types";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

const settingsSchema = z.object({
  carryoverMaxDays: z.coerce.number().min(0).max(365),
  trackingStartYear: z.coerce.number().min(2000).max(2100),
});

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = settingsSchema.safeParse({
    carryoverMaxDays: formData.get("carryoverMaxDays"),
    trackingStartYear: formData.get("trackingStartYear"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid settings." };

  await prisma.settings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

const leaveTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required."),
  color: z.string().min(1),
  countsAgainstAllowance: z.coerce.boolean(),
});

export async function upsertLeaveType(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = leaveTypeSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    color: formData.get("color") || "#2563eb",
    countsAgainstAllowance: formData.get("countsAgainstAllowance") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid leave type." };

  const { id, ...data } = parsed.data;
  if (id) {
    await prisma.leaveType.update({ where: { id }, data });
  } else {
    await prisma.leaveType.create({ data });
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function archiveLeaveType(id: string): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  await prisma.leaveType.update({ where: { id }, data: { archived: true } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function generateHolidaysForYear(year: number): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const holidays = niHolidaysForYear(year);
  for (const h of holidays) {
    await prisma.publicHoliday.upsert({
      where: { date: h.date },
      update: { name: h.name },
      create: { date: h.date, name: h.name },
    });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/calendar");
  return { success: true };
}

const holidaySchema = z.object({
  date: z.string().min(1, "Date is required."),
  name: z.string().min(1, "Name is required."),
});

export async function addPublicHoliday(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = holidaySchema.safeParse({ date: formData.get("date"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid holiday." };

  await prisma.publicHoliday.upsert({
    where: { date: new Date(parsed.data.date) },
    update: { name: parsed.data.name },
    create: { date: new Date(parsed.data.date), name: parsed.data.name },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/calendar");
  return { success: true };
}

export async function removePublicHoliday(id: string): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  await prisma.publicHoliday.delete({ where: { id } });
  revalidatePath("/admin/settings");
  revalidatePath("/calendar");
  return { success: true };
}
