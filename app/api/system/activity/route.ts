import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { visitorId } = await req.json()
    const session = await getSession()

    const now = new Date()

    // 1. Update Visitor (Browsing count)
    if (visitorId) {
      // Upsert visitor
      await prisma.visitor.upsert({
        where: { id: visitorId },
        create: { id: visitorId, lastSeen: now },
        update: { lastSeen: now },
      })
    }

    // 2. Update User (Logged in list)
    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastSeen: now },
      })
    }

    // 3. Return current stats immediately to save a request
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const [activeUsers, activeVisitorsCount] = await Promise.all([
      prisma.user.findMany({
        where: { lastSeen: { gt: fiveMinutesAgo } },
        select: { id: true, name: true, email: true },
        orderBy: { lastSeen: 'desc' }
      }),
      prisma.visitor.count({
        where: { lastSeen: { gt: fiveMinutesAgo } },
      }),
    ])

    return NextResponse.json({ 
      success: true,
      onlineUsers: activeUsers.map(u => ({ id: u.id, name: u.name || u.email })),
      visitorCount: activeVisitorsCount
    })
  } catch (error) {
    console.error('Activity update failed:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    // Parallel fetch
    const [activeUsers, activeVisitorsCount] = await Promise.all([
      prisma.user.findMany({
        where: { lastSeen: { gt: fiveMinutesAgo } },
        select: { id: true, name: true, email: true }, // Select minimal info
      }),
      prisma.visitor.count({
        where: { lastSeen: { gt: fiveMinutesAgo } },
      }),
    ])

    return NextResponse.json({
      onlineUsers: activeUsers.map(u => ({ id: u.id, name: u.name || u.email })),
      visitorCount: activeVisitorsCount,
    })
  } catch (error) {
    console.error('Fetch activity failed:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
