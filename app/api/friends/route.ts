import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        sentFriendships: {
          include: { receiver: { select: { id: true, name: true, email: true } } }
        },
        receivedFriendships: {
          include: { sender: { select: { id: true, name: true, email: true } } }
        },
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const friends = [
      ...user.sentFriendships.filter(f => f.status === 'accepted').map(f => ({ ...f.receiver, friendshipId: f.id })),
      ...user.receivedFriendships.filter(f => f.status === 'accepted').map(f => ({ ...f.sender, friendshipId: f.id }))
    ]

    const sent = user.sentFriendships.filter(f => f.status === 'pending').map(f => ({ ...f.receiver, friendshipId: f.id }))
    const received = user.receivedFriendships.filter(f => f.status === 'pending').map(f => ({ ...f.sender, friendshipId: f.id }))

    return NextResponse.json({
      friends,
      sent,
      received
    })
  } catch (err) {
    console.error('Initial friends fetch error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, userId } = await request.json()

  if ((!email && !userId) || email === session.user.email || userId === session.user.id) {
    return NextResponse.json({ error: 'Invalid user target' }, { status: 400 })
  }

  try {
    let targetUser;
    
    if (userId) {
       targetUser = await prisma.user.findUnique({ where: { id: userId } })
    } else {
       targetUser = await prisma.user.findUnique({ where: { email } })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: session.user.id }
        ]
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Friendship already exists or pending' }, { status: 409 })
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId: session.user.id,
        receiverId: targetUser.id,
        status: 'pending'
      }
    })

    return NextResponse.json(friendship)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendshipId, action } = await request.json()

  if (action !== 'accept') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    })

    if (!friendship || friendship.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorization to accept this request' }, { status: 403 })
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update friendship' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendshipId } = await request.json()

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    })

    // Allow deleting if user is sender OR receiver
    if (!friendship || (friendship.senderId !== session.user.id && friendship.receiverId !== session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete friendship' }, { status: 500 })
  }
}
