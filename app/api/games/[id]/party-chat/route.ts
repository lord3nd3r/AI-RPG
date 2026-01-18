import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  // Verify access
  const game = await prisma.game.findUnique({
    where: { id },
    select: { dmUserId: true, characters: { include: { character: { select: { userId: true } } } } }
  })

  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isPlayer = game.characters.some(c => c.character.userId === session.user.id)
  const isDM = game.dmUserId === session.user.id

  if (!isPlayer && !isDM) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await prisma.partyMessage.findMany({
    where: { gameId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      character: {
        select: { name: true, id: true }
      }
    }
  })

  return NextResponse.json(messages.reverse())
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { message } = await request.json()

  if (!message || !message.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  // Find character for this user in this game
  const gameChar = await prisma.gameCharacter.findFirst({
    where: {
      gameId: id,
      character: { userId: session.user.id }
    },
    select: { characterId: true }
  })

  if (!gameChar) {
    // If DM, maybe allow but we need a characterId. 
    // For now, strict: Only characters can chat in Party Chat (OOC).
    return NextResponse.json({ error: 'Only characters can use party chat' }, { status: 403 })
  }

  const created = await prisma.partyMessage.create({
    data: {
      gameId: id,
      characterId: gameChar.characterId,
      content: message.trim()
    },
    include: {
      character: { select: { name: true } }
    }
  })

  return NextResponse.json(created)
}
