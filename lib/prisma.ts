import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    // Force specific database URL to avoid environment pollution
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const dbUrl = `file:${dbPath}`;
    console.log(`Initializing PrismaClient with URL: ${dbUrl}`);
    
    return new PrismaClient({
        log: ['query', 'error', 'warn'],
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma