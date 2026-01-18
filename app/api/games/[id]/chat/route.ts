import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAIResponse } from '@/lib/ai'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await Promise.resolve(params)
  const { message } = await request.json()

  // 1. Save user message
  await prisma.message.create({
    data: {
      gameId: id,
      role: 'user',
      content: message,
    },
  })

  // 2. Fetch game context (messages & characters)
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 20 }, // Context window
      characters: { include: { character: true } },
    },
  })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // 3. Construct prompt
  const charactersContext = game.characters.map(gc => `
    Name: ${gc.character.name} (${gc.character.class})
    HP: ${gc.currentHp}/${gc.maxHp}
    Stats: ${gc.character.stats}
    Condition: ${JSON.stringify(gc.statusEffects)}
  `).join('\n')

  const previousMessages = game.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
  
  const systemPrompt = `You are the Dungeon Master for a fantasy RPG. 
Your players are:
${charactersContext}

Your goal is to narrate the adventure, ask for skill checks, and manage combat.
IMPORTANT: You have the power to update character stats.
If a character takes damage, heals, gains xp, or gets a status effect, you MUST include a JSON block at the end of your response like this:
\`\`\`json
{
  "updates": [
    { "characterName": "Sorian", "hpChange": -5 }, 
    { "characterName": "Sorian", "statusEffect": "Poisoned", "action": "add" }
  ]
}
\`\`\`
Valid actions for statusEffects are "add" or "remove".
Keep your narration engaging but concise.
`

  const prompt = `Current Story:
${previousMessages}

USER: ${message}

DM:`

  // 4. Generate AI response
  try {
    let aiResponseContent = await generateAIResponse({
      provider: game.aiProvider as any,
      prompt: prompt,
      systemPrompt: systemPrompt,
    })

    // 5. Detect and apply updates
    // We look for the JSON block
    const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        const updateData = JSON.parse(jsonMatch[1])
        if (updateData.updates) {
          for (const update of updateData.updates) {
            // Find character
            const targetChar = game.characters.find(c => c.character.name === update.characterName)
            if (targetChar) {
              const updates: any = {}
              if (update.hpChange) {
                updates.currentHp = { increment: update.hpChange }
              }
              if (update.statusEffect) {
                const currentEffects = JSON.parse(targetChar.statusEffects as string || '[]')
                if (update.action === 'add' && !currentEffects.includes(update.statusEffect)) {
                  updates.statusEffects = JSON.stringify([...currentEffects, update.statusEffect])
                } else if (update.action === 'remove') {
                  updates.statusEffects = JSON.stringify(currentEffects.filter((e: string) => e !== update.statusEffect))
                }
              }

              if (Object.keys(updates).length > 0) {
                 await prisma.gameCharacter.update({
                   where: {
                     gameId_characterId: {
                       gameId: id,
                       characterId: targetChar.characterId
                     }
                   },
                   data: updates
                 })
              }
            }
          }
        }
        // Clean up the response to hide the JSON from the user? 
        // Or keep it for debug? Let's hide it for immersion.
        aiResponseContent = aiResponseContent.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
      } catch (e) {
        console.error('Failed to parse DM updates', e)
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
