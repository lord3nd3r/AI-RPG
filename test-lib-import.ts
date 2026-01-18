
import { prisma } from './lib/prisma';

async function main() {
    console.log("Testing lib/prisma.ts import...");
    try {
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
