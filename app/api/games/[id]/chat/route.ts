import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAIResponseWithRetries } from '@/lib/ai'
import { DMUpdateSchema } from '@/lib/validators/dm' 
import { Game, Message, GameCharacter, Character, Prisma } from '@prisma/client'

// Define the shape of the game including relations
type GameWithContext = Game & {
  messages: (Message & { character: Character | null })[]
  characters: (GameCharacter & { character: Character })[]
} 

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const { id } = resolvedParams
  const { message } = await request.json()

  // 1. Identify character
  const gameChar = await prisma.gameCharacter.findFirst({
    where: {
      gameId: id,
      character: { userId: session.user.id }
    },
    include: { character: true }
  })

  // 2. Save user message with character info
  const messageData: {
      gameId: string
      role: 'user' | 'assistant' | 'system'
      content: string
      characterId?: string
  } = {
    gameId: id,
    role: 'user',
    content: message,
  }
  if (gameChar?.characterId) {
    messageData.characterId = gameChar.characterId
  }

  await prisma.message.create({
    data: messageData,
  })

  // 3. Fetch game context (messages & characters)
  const gameRaw = await prisma.game.findUnique({
    where: { id },
    include: {
      messages: { 
        orderBy: { createdAt: 'asc' }, 
        take: 20,
        include: { character: true } 
      }, 
      characters: { include: { character: true } },
    },
  })

  const game = gameRaw as unknown as GameWithContext | null

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // 4. Construct prompt
  const charactersContext = game.characters.map(gc => `
    Name: ${gc.character.name} (${gc.character.class})
    HP: ${gc.currentHp}/${gc.maxHp}
    MP: ${gc.currentMp}/${gc.maxMp}
    Stats: ${gc.character.stats}
    Condition: ${JSON.stringify(gc.statusEffects)}
  `).join('\n')

  const previousMessages = game.messages.map(m => {
    if (m.role === 'assistant') return `DM: ${m.content}`;
    if (m.character) return `${m.character.name}: ${m.content}`;
    return `Player: ${m.content}`;
  }).join('\n')
  
  const systemPrompt = `You are the Dungeon Master for a fantasy RPG. 
Adventure Title: ${game.name}
World Setting: ${game.description || 'A mysterious fantasy realm.'}

Your players are:
${charactersContext}

Your goal is to narrate the adventure based on the World Setting above and manage combat.
CRITICAL RULE: Do NOT ask the player to roll dice. Instead, YOU must simulate the roll yourself based on their stats and the difficulty.
- Narrate the roll result (e.g. "You rolled a 15 + 3 = 18").
- Determine success or failure immediately.
- Narrate the consequence.

IMPORTANT: You have the power to update character stats and grant loot.
If a character takes damage, heals, uses mana, gains xp, gets a status effect, or LOOTS an item, you MUST include a JSON block at the end of your response.

Example Format:
\`\`\`json
{
  "updates": [
    { "characterName": "Sorian", "hpChange": -5, "mpChange": -2, "xpChange": 50 }, 
    { "characterName": "Sorian", "statusEffect": "Poisoned", "action": "add" }
  ],
  "loot": [
    { "characterName": "Sorian", "itemName": "Rusty Dagger", "quantity": 1, "description": "An old dagger." }
  ]
}
\`\`\`
Valid actions for statusEffects are "add" or "remove".
For loot, provide the item name. If it's a new unique item, feel free to add a description.
Keep your narration engaging but concise.
`

  const prompt = `Current Story:
${previousMessages}

${gameChar?.character.name || 'Player'}: ${message}

DM:`

  // 4. Generate AI response with retries and validated updates
  try {
    let aiResponseContent: string

    try {
      aiResponseContent = await generateAIResponseWithRetries({
        provider: game.aiProvider as import('@/lib/ai').AIProvider,
        prompt: prompt,
        systemPrompt: systemPrompt,
      }, 3, 500)
    } catch (err) {
      console.error('AI generation retries failed:', err)
      const failMsg = 'The Dungeon Master is unavailable right now. Please try again shortly.'
      const savedFail = await prisma.message.create({ data: { gameId: id, role: 'assistant', content: failMsg } })
      return NextResponse.json({ message: savedFail })
    }

    // Helper to try to extract JSON from the DM's text
    function extractJson(text: string): string | null {
      const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (codeBlock) return codeBlock[1]

      // Fallback: attempt to find a JSON object by matching braces (simple heuristic)
      const firstBrace = text.indexOf('{')
      if (firstBrace === -1) return null
      let depth = 0
      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === '{') depth++
        else if (text[i] === '}') {
          depth--
          if (depth === 0) {
            return text.slice(firstBrace, i + 1)
          }
        }
      }
      return null
    }

    const jsonString = extractJson(aiResponseContent)
    if (jsonString) {
      try {
        // Sanitize JSON: remove leading + from numbers (e.g. +10) which is invalid in standard JSON
        const cleanedJson = jsonString.replace(/:\s*\+(\d+)/g, ': $1')
        const parsed = JSON.parse(cleanedJson)
        const result = DMUpdateSchema.safeParse(parsed)
        if (result.success) {
          const updateData = result.data
          for (const update of updateData.updates) {
            const targetChar = game.characters.find(c => c.character.name === update.characterName)
            if (!targetChar) continue

            const dbUpdates: Record<string, unknown> = {}
            if (typeof update.hpChange === 'number') {
              dbUpdates.currentHp = { increment: update.hpChange }
            }

            if (typeof update.mpChange === 'number') {
              dbUpdates.currentMp = { increment: update.mpChange }
            }

            let newExp = targetChar.exp
            if (typeof update.xpChange === 'number') {
              // Calculate new XP locally to check for level up
              newExp = (targetChar.exp || 0) + update.xpChange
              dbUpdates.exp = newExp
            }
            
            // Leveling Formula: Level = floor(sqrt(XP / 100)) + 1
            // 0 XP = Lvl 1
            // 100 XP = Lvl 2
            // 400 XP = Lvl 3
            // 900 XP = Lvl 4
            const calculateLevel = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
            const newLevel = calculateLevel(newExp)
            const currentLevel = targetChar.level || 1

            if (newLevel > currentLevel) {
              dbUpdates.level = newLevel
              const levelsGained = newLevel - currentLevel
              
              // Stat bonuses
              const hpBonus = 10 * levelsGained
              const mpBonus = 5 * levelsGained
              
              if (typeof dbUpdates.maxHp === 'object') { (dbUpdates.maxHp as any).increment += hpBonus } else { dbUpdates.maxHp = { increment: hpBonus } }
              if (typeof dbUpdates.currentHp === 'object') { (dbUpdates.currentHp as any).increment += hpBonus } else { dbUpdates.currentHp = { increment: hpBonus } }
              
              if (typeof dbUpdates.maxMp === 'object') { (dbUpdates.maxMp as any).increment += mpBonus } else { dbUpdates.maxMp = { increment: mpBonus } }
              if (typeof dbUpdates.currentMp === 'object') { (dbUpdates.currentMp as any).increment += mpBonus } else { dbUpdates.currentMp = { increment: mpBonus } }

              aiResponseContent += `\n\n✨ **LEVEL UP!** ${targetChar.character.name} has reached Level ${newLevel}! (+${hpBonus} HP, +${mpBonus} MP)`
            }

            if (update.statusEffect) {
              const currentEffects = JSON.parse(targetChar.statusEffects as string || '[]')
              if (update.action === 'add' && !currentEffects.includes(update.statusEffect)) {
                dbUpdates.statusEffects = JSON.stringify([...currentEffects, update.statusEffect])
              } else if (update.action === 'remove') {
                dbUpdates.statusEffects = JSON.stringify(currentEffects.filter((e: string) => e !== update.statusEffect))
              }
            }

            if (Object.keys(dbUpdates).length > 0) {
              await prisma.gameCharacter.update({
                where: {
                  gameId_characterId: {
                    gameId: id,
                    characterId: targetChar.characterId,
                  },
                },
                data: dbUpdates,
              })
            }
          }

          // Handle Loot
          if (updateData.loot && updateData.loot.length > 0) {
            for (const drop of updateData.loot) {
              const targetChar = game.characters.find(c => c.character.name === drop.characterName)
              if (!targetChar) continue

              // Find or create item
              // Note: Ideally we fuzzily match existing items, but for now we look for exact name match
              // If not found, we create a new Item.
              let item = await prisma.item.findFirst({ where: { name: drop.itemName } })
              
              if (!item) {
                item = await prisma.item.create({
                  data: {
                    name: drop.itemName,
                    description: drop.description || 'Created by DM AI',
                    rarity: 'Common' // Default
                  }
                })
              }

              // Add to inventory (Atomic Upsert Logic)
              const existingInv = await prisma.gameInventoryItem.findFirst({
                where: {
                  gameId: id,
                  characterId: targetChar.characterId,
                  itemId: item.id
                }
              })

              const qty = drop.quantity ?? 1

              if (existingInv) {
                await prisma.gameInventoryItem.update({
                  where: { id: existingInv.id },
                  data: { quantity: { increment: qty } }
                })
              } else {
                await prisma.gameInventoryItem.create({
                  data: {
                    gameId: id,
                    characterId: targetChar.characterId,
                    itemId: item.id,
                    quantity: qty
                  }
                })
              }

              aiResponseContent += `\n\n🎁 **LOOT!** ${targetChar.character.name} received: ${qty}x ${item.name}`
            }
          }
        } else {
          console.warn('DM updates failed validation', result.error)
          aiResponseContent = aiResponseContent + '\n\n[System: The DM sent updates that failed validation. No updates applied.]'
        }

        // Remove the JSON block from the visible message for immersion
        const codeBlockRegex = /```json\s*[\s\S]*?\s*```/
        if (codeBlockRegex.test(aiResponseContent)) {
          aiResponseContent = aiResponseContent.replace(codeBlockRegex, '').trim()
        } else if (jsonString && aiResponseContent.includes(jsonString)) {
          aiResponseContent = aiResponseContent.replace(jsonString, '').trim()
          // Cleanup stray "JSON" labels at the end
          aiResponseContent = aiResponseContent.replace(/\b(JSON|json)\s*$/g, '').trim()
        }
      } catch (e) {
        console.error('Failed to parse DM updates', e, '\nRaw DM output:', aiResponseContent)
        // Notify players (and devs) that the DM's update couldn't be parsed
        aiResponseContent = aiResponseContent + '\n\n[System: The DM attempted to send structured updates but they could not be parsed. No updates were applied.]'
      }
    }

    // 6. Save AI message
    const savedAiMessage = await prisma.message.create({
      data: {
        gameId: id,
        role: 'assistant',
        content: aiResponseContent,
      },
    })

    return NextResponse.json({ message: savedAiMessage })

  } catch (error) {
    console.error('AI generation failed:', error)
    return NextResponse.json({ error: 'AI failed to respond' }, { status: 500 })
  }
}
