import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: session.user.id }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true, email: true, lastSeen: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Transform for easier consumption
    const formatted = conversations.map(c => {
      const otherParticipants = c.participants.filter(p => p.id !== session.user.id)
      const lastMessage = c.messages[0]
      return {
        id: c.id,
        participants: otherParticipants,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          read: lastMessage.read
        } : null,
        updatedAt: c.updatedAt
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetUserId } = await req.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user required' }, { status: 400 })
    }

    // 1. Check if conversation already exists between these 2
    // This is a bit complex with Prisma many-to-many. 
    // We want a conversation where participants has every ID in [myId, targetId] and count is 2.
    // Easier approach: Find all convs I am in, filter for one that also has target.
    
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: session.user.id } } },
          { participants: { some: { id: targetUserId } } }
         // We assume 1-on-1 chats for now. If group chats added later, we need stricter check.
        ]
      }
    })

    if (existing) {
      return NextResponse.json({ id: existing.id })
    }

    // 2. Create new
    const newConv = await prisma.conversation.create({
      data: {
        participants: {
          connect: [
            { id: session.user.id },
            { id: targetUserId }
          ]
        }
      }
    })

    return NextResponse.json({ id: newConv.id })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
