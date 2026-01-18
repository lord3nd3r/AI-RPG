import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await Promise.resolve(params)

  // Only allow deleting your own character
  const character = await prisma.character.findUnique({
    where: { id }
  })
  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Remove from all games (cascade handled by schema)
  await prisma.character.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await Promise.resolve(params)
  const data = await request.json()

  // Only allow editing your own character
  const character = await prisma.character.findUnique({
    where: { id }
  })
  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only allow updating name and class for now
  const updated = await prisma.character.update({
    where: { id },
    data: {
      name: data.name,
      class: data.class
    }
  })
  return NextResponse.json(updated)
}
