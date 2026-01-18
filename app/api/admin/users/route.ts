import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ROOT_EMAIL = process.env.ROOT_ADMIN_EMAIL

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isRoot = ROOT_EMAIL && session.user.email === ROOT_EMAIL
  const isAdmin = session.user.role === 'admin' || isRoot

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
      lastSeen: true,
      _count: {
        select: {
          characters: true,
          games: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  // Flag the root user in the response so UI knows
  const usersWithMeta = users.map(u => ({
    ...u,
    isRoot: !!(ROOT_EMAIL && u.email === ROOT_EMAIL)
  }))

  return NextResponse.json({ users: usersWithMeta, isRoot })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isRoot = ROOT_EMAIL && session.user.email === ROOT_EMAIL
  const isAdmin = session.user.role === 'admin' || isRoot

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { action, userId } = await request.json()
    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetIsRoot = ROOT_EMAIL && targetUser.email === ROOT_EMAIL

    if (targetIsRoot) {
      return NextResponse.json({ error: 'Cannot modify root admin' }, { status: 403 })
    }

    if (action === 'promote' || action === 'demote') {
      // Only root can change admin status
      if (!isRoot) {
        return NextResponse.json({ error: 'Only root admin can change admin status' }, { status: 403 })
      }
      
      const newRole = action === 'promote' ? 'admin' : 'user'
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
      })
    } else if (action === 'ban' || action === 'unban') {
      const isBanning = action === 'ban'
      
      // Prevent admin from banning other admins (unless root)
      if (targetUser.role === 'admin' && !isRoot) {
        return NextResponse.json({ error: 'Only root can ban other admins' }, { status: 403 })
      }

      await prisma.user.update({
        where: { id: userId },
        data: { banned: isBanning }
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin action error', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
