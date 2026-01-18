import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch games
  const games = await prisma.game.findMany({
    where: {
      isPublic: true,
      status: 'active'
    },
    include: {
      _count: {
        select: { characters: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const formattedGames = games.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    isPublic: g.isPublic,
    maxPlayers: g.maxPlayers,
    characterCount: g._count.characters
  }))

  // Fetch user's characters provided they aren't already permanently locked (future proofing)
  // For now just fetch all characters owned by user
  const characters = await prisma.character.findMany({
    where: {
      userId: session.user.id
    }
  })

  return NextResponse.json({
    games: formattedGames,
    characters: characters.map(c => ({ id: c.id, name: c.name, class: c.class }))
  })
}
