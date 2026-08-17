import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Single connection: with a pool >1, queries routed to a second physical
  // connection have intermittently hit "bind message supplies N parameters,
  // but prepared statement requires 0" (a prepared-statement/connection-pool
  // interaction bug seen with @prisma/adapter-pg 7.x). One connection avoids it
  // entirely; this app's traffic (a handful of staff) doesn't need real pooling.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
