import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gameId = request.nextUrl.searchParams.get('gameId')
  const characterId = request.nextUrl.searchParams.get('characterId')

  if (!gameId || !characterId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  // Verify the character belongs to the user and is in the game
  const gameChar = await prisma.gameCharacter.findUnique({
    where: { gameId_characterId: { gameId, characterId } },
    include: { character: true }
  })

  if (!gameChar || gameChar.character.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const items = await prisma.gameInventoryItem.findMany({
    where: { gameId, characterId },
    include: { item: true }
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { gameId, characterId, action, itemId, quantity = 1 } = body
    if (!gameId || !characterId || !action || !itemId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Verify ownership
    const gameChar = await prisma.gameCharacter.findUnique({ where: { gameId_characterId: { gameId, characterId } }, include: { character: true } })
    if (!gameChar || gameChar.character.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'use') {
      // Apply item effects if defined in Item.meta, then reduce quantity
      const inv = await prisma.gameInventoryItem.findFirst({ where: { gameId, characterId, itemId }, include: { item: true, gameCharacter: true } })
      if (!inv) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

      // Parse meta if present
      try {
        if (inv.item?.meta) {
          const meta = JSON.parse(inv.item.meta)
          const updates: any = {}
          if (typeof meta.hpRestore === 'number') {
            updates.currentHp = { increment: Math.max(0, Math.floor(meta.hpRestore)) }
          }
          if (typeof meta.mpRestore === 'number') {
            updates.currentMp = { increment: Math.max(0, Math.floor(meta.mpRestore)) }
          }
          if (typeof meta.statusEffect === 'string') {
            // add status effect
            const existing = JSON.parse(inv.gameCharacter?.statusEffects || '[]')
            if (!existing.includes(meta.statusEffect)) existing.push(meta.statusEffect)
            updates.statusEffects = JSON.stringify(existing)
          }

          if (Object.keys(updates).length > 0) {
            // Clamp HP/MP to max values after applying increments
            await prisma.gameCharacter.update({
              where: { gameId_characterId: { gameId, characterId } },
              data: updates as any,
            })
            // Ensure HP/MP do not exceed max
            const current = await prisma.gameCharacter.findUnique({ where: { gameId_characterId: { gameId, characterId } } })
            const clampUpdates: any = {}
            if (current) {
              if (current.currentHp > current.maxHp) clampUpdates.currentHp = current.maxHp
              if (current.currentMp > current.maxMp) clampUpdates.currentMp = current.maxMp
            }
            if (Object.keys(clampUpdates).length > 0) {
              await prisma.gameCharacter.update({ where: { gameId_characterId: { gameId, characterId } }, data: clampUpdates })
            }
          }
        }
      } catch (e) {
        console.warn('Failed to apply item meta', e)
      }

      if (inv.quantity <= quantity) {
        await prisma.gameInventoryItem.delete({ where: { id: inv.id } })
      } else {
        await prisma.gameInventoryItem.update({ where: { id: inv.id }, data: { quantity: { decrement: quantity } } })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'examine') {
      const item = await prisma.item.findUnique({ where: { id: itemId } })
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      return NextResponse.json({ item })
    }

    if (action === 'equip' || action === 'unequip') {
      const inv = await prisma.gameInventoryItem.findFirst({ where: { gameId, characterId, itemId } })
      if (!inv) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      await prisma.gameInventoryItem.update({ where: { id: inv.id }, data: { equipped: action === 'equip' } })
      return NextResponse.json({ success: true })
    }

    if (action === 'drop') {
      const inv = await prisma.gameInventoryItem.findFirst({ where: { gameId, characterId, itemId } })
      if (!inv) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      await prisma.gameInventoryItem.delete({ where: { id: inv.id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
