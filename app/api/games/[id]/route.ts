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

  let game = await prisma.game.findUnique({
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

  // If no messages yet, ask the AI to generate an opening scene on first load
  if ((game.messages || []).length === 0) {
    try {
      const introSystem = `You are the Dungeon Master for a brand new party. Provide a short engaging opening scene for a fantasy RPG that introduces tone, setting, and a first choice for the players. Keep it concise but evocative.`
      const { generateAIResponse } = await import('@/lib/ai')
      const intro = await generateAIResponse({
        provider: game.aiProvider as any,
        prompt: 'Start the adventure with a short opening scene and an immediate hook for the players.',
        systemPrompt: introSystem,
        maxTokens: 400,
      })

      const msg = await prisma.message.create({
        data: { gameId: id, role: 'assistant', content: intro },
      })

      // Re-fetch game with messages included
      game = await prisma.game.findUnique({
        where: { id },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          characters: { include: { character: true } },
        },
      })
    } catch (err) {
      console.warn('Failed to generate initial DM message on GET', err)
    }
  }

  return NextResponse.json(game)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await Promise.resolve(params)
  const data = await request.json()

  // Only DM can edit
  if (data.name || data.description || typeof data.isPublic !== 'undefined' || data.maxPlayers) {
    const game = await prisma.game.findUnique({ where: { id } })
    if (!game || game.dmUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        name: data.name ?? game.name,
        description: typeof data.description !== 'undefined' ? data.description : game.description,
        isPublic: typeof data.isPublic !== 'undefined' ? data.isPublic : game.isPublic,
        maxPlayers: typeof data.maxPlayers !== 'undefined' ? Number(data.maxPlayers) : game.maxPlayers,
      },
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await Promise.resolve(params)
  const game = await prisma.game.findUnique({ where: { id } })
  if (!game || game.dmUserId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.game.delete({ where: { id } })
  return NextResponse.json({ success: true })
}