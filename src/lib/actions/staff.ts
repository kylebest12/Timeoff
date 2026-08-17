"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";
import { generateTempPassword } from "@/lib/random";
import type { ActionState } from "./types";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

const staffSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["ADMIN", "STAFF"]),
  startDate: z.string().min(1, "Start date is required."),
  annualAllowanceDays: z.coerce.number().min(0).max(365),
});

export async function createStaffMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    startDate: formData.get("startDate"),
    annualAllowanceDays: formData.get("annualAllowanceDays"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A staff member with this email already exists." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: parsed.data.role,
      startDate: new Date(parsed.data.startDate),
      annualAllowanceDays: parsed.data.annualAllowanceDays,
    },
  });

  revalidatePath("/admin/staff");

  await sendEmail(
    email,
    "Your leave booking account",
    `Hi ${parsed.data.name},\n\nAn account has been set up for you on the Best Property Services leave booking app.\n\n` +
      `Sign in at ${process.env.AUTH_URL ?? ""}/login\nEmail: ${email}\nTemporary password: ${tempPassword}\n\n` +
      `Please sign in and change your password from your profile page.`,
  );

  return { success: true };
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["ADMIN", "STAFF"]),
  startDate: z.string().min(1),
  annualAllowanceDays: z.coerce.number().min(0).max(365),
  active: z.coerce.boolean(),
});

export async function updateStaffMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    startDate: formData.get("startDate"),
    annualAllowanceDays: formData.get("annualAllowanceDays"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  if (parsed.data.id === session.user.id && !parsed.data.active) {
    return { error: "You can't deactivate your own account." };
  }
  if (parsed.data.id === session.user.id && parsed.data.role !== "ADMIN") {
    return { error: "You can't remove your own admin access." };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      startDate: new Date(parsed.data.startDate),
      annualAllowanceDays: parsed.data.annualAllowanceDays,
      active: parsed.data.active,
    },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function resetStaffPassword(userId: string): Promise<ActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Staff member not found." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await sendEmail(
    user.email,
    "Your leave booking password was reset",
    `Hi ${user.name},\n\nYour password has been reset.\n\nTemporary password: ${tempPassword}\n\n` +
      `Sign in at ${process.env.AUTH_URL ?? ""}/login and change it from your profile page.`,
  );

  return { success: true };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export async function changeOwnPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "You must be signed in." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}
