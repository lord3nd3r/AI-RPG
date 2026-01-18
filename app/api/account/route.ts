import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, name } = body

    if (!email && !password && !name) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updateData: { email?: string; password?: string; name?: string } = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (password) {
        if (password.length < 6) {
             return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }
        updateData.password = await hash(password, 12)
    }

    // If updating email, check if it's already taken
    if (email) {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing && existing.id !== session.user.id) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
        }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({ 
        message: 'Profile updated successfully',
        user: { id: user.id, email: user.email, name: user.name } 
    })

  } catch (error) {
    console.error('Account update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
