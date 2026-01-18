import { prisma } from '../lib/prisma'

async function main() {
  const games = await prisma.game.findMany({ include: { messages: true, characters: { include: { character: true } } } })
  console.log(JSON.stringify(games, null, 2))
}

main().catch((e)=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
