import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { niHolidaysForYears } from "../src/lib/holidays";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const currentYear = new Date().getFullYear();

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, carryoverMaxDays: 3, trackingStartYear: currentYear },
  });

  const leaveTypes = [
    { name: "Annual Leave", color: "#2563eb", countsAgainstAllowance: true },
    { name: "Sick Leave", color: "#dc2626", countsAgainstAllowance: false },
    { name: "Unpaid Leave", color: "#6b7280", countsAgainstAllowance: false },
    { name: "Other", color: "#7c3aed", countsAgainstAllowance: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({ where: { name: lt.name }, update: {}, create: lt });
  }

  const holidays = niHolidaysForYears(currentYear - 1, currentYear + 2);
  for (const h of holidays) {
    await prisma.publicHoliday.upsert({
      where: { date: h.date },
      update: { name: h.name },
      create: { date: h.date, name: h.name },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Admin";
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        startDate: new Date(Date.UTC(currentYear, 0, 1)),
        annualAllowanceDays: 28,
      },
    });
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin user creation.");
  }

  console.log(`Seeded ${leaveTypes.length} leave types and ${holidays.length} public holidays.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
