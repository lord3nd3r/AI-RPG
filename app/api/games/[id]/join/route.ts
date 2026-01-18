import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { characterId } = await request.json()
  if (!characterId) {
    return NextResponse.json({ error: 'Character ID required' }, { status: 400 })
  }
  
  const { id } = await Promise.resolve(params)

  // Check if game exists and is open
  const game = await prisma.game.findUnique({
    where: { id },
    include: { characters: true }
  })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  if (game.characters.length >= (game.maxPlayers || 4)) {
    return NextResponse.json({ error: 'Game is full' }, { status: 403 })
  }
  
  // Verify character belongs to user
  const character = await prisma.character.findUnique({
    where: { id: characterId }
  })

  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: 'Invalid character' }, { status: 403 })
  }

  // Check if already in game
  const existingEntry = await prisma.gameCharacter.findUnique({
    where: {
      gameId_characterId: {
        gameId: id,
        characterId: characterId
      }
    }
  })

  if (existingEntry) {
    return NextResponse.json({ message: 'Already in game' }, { status: 200 })
  }

  // Join
  await prisma.gameCharacter.create({
    data: {
      gameId: id,
      characterId: characterId,
      // Initialize stats from character definition if needed, 
      // though default values in schema handle basic 10/10 HP.
      // We might want to parse stats from the character model later.
      currentHp: 10, 
      maxHp: 10 
    }
  })

  return NextResponse.json({ success: true })
}
