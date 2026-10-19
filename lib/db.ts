import { PrismaPg } from "@prisma/adapter-pg";
import getConfig from "../src/config";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: getConfig().databaseUrl });

export const prisma = new PrismaClient({ adapter });

export async function initDatabase(): Promise<void> {
	await prisma.$connect();
}

export async function closeDatabase(): Promise<void> {
	await prisma.$disconnect();
}
