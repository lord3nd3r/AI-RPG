import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.item.findMany({
    orderBy: { name: 'asc' }
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // TODO: Check for DM role/permissions eventually
  
  try {
    const body = await request.json()
    const { name, description, rarity, meta } = body
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    
    const item = await prisma.item.create({
      data: {
        name,
        description,
        rarity,
        meta: meta ? JSON.stringify(meta) : null
      }
    })
    
    return NextResponse.json({ item })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
