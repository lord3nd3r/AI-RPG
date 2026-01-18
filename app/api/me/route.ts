import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      characters: true,
      games: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    characters: user.characters,
    games: user.games,
  })
}