import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: conversationId } = await params

  try {
    // Verify participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { id: true, name: true, email: true, lastSeen: true } } }
    })

    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const isParticipant = conversation.participants.some((p) => p.id === session.user.id)
    if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 100 // Limit for now
    })
    
    // Mark as read (async/fire-and-forget sort of, but we await it for safety)
    // Only mark messages NOT sent by me as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        read: false
      },
      data: { read: true }
    })

    return NextResponse.json({
      conversation,
      messages
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: conversationId } = await params
  const { content } = await req.json()

  if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  try {
    // create message
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content
      }
    })

    // touch conversation updated at
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
