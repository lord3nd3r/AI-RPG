import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const { characterId } = await request.json()

    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
    }

    // Check if game belongs to user
    const game = await prisma.game.findUnique({
      where: { id, dmUserId: session.user.id },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if character belongs to user
    const character = await prisma.character.findUnique({
      where: { id: characterId, userId: session.user.id },
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const gameCharacter = await prisma.gameCharacter.create({
      data: {
        gameId: id,
        characterId,
      },
    })

    return NextResponse.json(gameCharacter)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Return the gameCharacter entry for the current user in this game (if any)
  const gameChar = await prisma.gameCharacter.findFirst({
    where: { gameId: id, character: { userId: session.user.id } },
    include: { character: true }
  })

  if (!gameChar) return NextResponse.json({ message: 'Not in game' }, { status: 200 })

  return NextResponse.json(gameChar)
}