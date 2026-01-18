import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Await params since it's now a promise in newer Next.js versions (though in route handlers usually direct for now)
  // To be safe with Next 16 type definitions:
  const { id } = await Promise.resolve(params)

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      characters: {
        include: {
          character: true,
        },
      },
    },
  })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  return NextResponse.json(game)
}
