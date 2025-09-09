import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import { PrismaSQLite } from '@prisma/adapter-sqlite'

const sqlite = new Database('./prisma/dev.db')
const adapter = new PrismaSQLite(sqlite)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma