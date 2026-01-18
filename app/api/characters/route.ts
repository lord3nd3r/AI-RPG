import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, class: characterClass, stats } = await request.json()

    if (!name || !stats) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const character = await prisma.character.create({
      data: {
        name,
        class: characterClass || 'Warrior',
        stats: JSON.stringify(stats),
        userId: session.user.id,
      },
    })

    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const characters = await prisma.character.findMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json(characters)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}