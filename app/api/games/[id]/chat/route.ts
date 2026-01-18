import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAIResponseWithRetries } from '@/lib/ai'
import { DMUpdateSchema } from '@/lib/validators/dm' 

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await Promise.resolve(params)
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
  await prisma.message.create({
    data: {
      gameId: id,
      role: 'user',
      content: message,
      characterId: gameChar?.characterId, // Track who said it
    },
  })

  // 3. Fetch game context (messages & characters)
  const game = await prisma.game.findUnique({
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
Your players are:
${charactersContext}

Your goal is to narrate the adventure, ask for skill checks, and manage combat.
IMPORTANT: You have the power to update character stats.
If a character takes damage, heals, uses mana, gains xp, or gets a status effect, you MUST include a JSON block at the end of your response like this:
\`\`\`json
{
  "updates": [
    { "characterName": "Sorian", "hpChange": -5, "mpChange": -2 }, 
    { "characterName": "Sorian", "statusEffect": "Poisoned", "action": "add" }
  ]
}
\`\`\`
Valid actions for statusEffects are "add" or "remove".
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
        const parsed = JSON.parse(jsonString)
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
        } else {
          console.warn('DM updates failed validation', result.error)
          aiResponseContent = aiResponseContent + '\n\n[System: The DM sent updates that failed validation. No updates applied.]'
        }

        // Remove the JSON block from the visible message for immersion
        aiResponseContent = aiResponseContent.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
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
