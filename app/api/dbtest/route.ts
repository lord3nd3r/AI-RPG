import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({ count })
  } catch (error) {
    console.error('DB test error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}