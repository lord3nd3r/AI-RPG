import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, description, aiProvider, isPublic, maxPlayers } = await request.json()

    if (!name || !aiProvider) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const game = await prisma.game.create({
      data: {
        name,
        description,
        aiProvider,
        isPublic: isPublic || false,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : 4,
        dmUserId: session.user.id,
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const games = await prisma.game.findMany({
      where: { dmUserId: session.user.id },
      include: { characters: { include: { character: true } } },
    })

    return NextResponse.json(games)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}