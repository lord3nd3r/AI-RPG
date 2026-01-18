import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      let lastUpdate = 0

      // Keep connection alive check
      const interval = setInterval(async () => {
        try {
          // Check if game has new messages or updates
          // We check the latest Message.createdAt and Game.updatedAt
          
          const gameCheck = await prisma.game.findUnique({
            where: { id },
            select: { updatedAt: true }
          })
          
          if (!gameCheck) {
            controller.enqueue(encoder.encode('event: error\ndata: Game not found\n\n'))
            controller.close()
            clearInterval(interval)
            return
          }

          const lastMsg = await prisma.message.findFirst({
            where: { gameId: id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          })
          
          const lastPartyMsg = await prisma.partyMessage.findFirst({
            where: { gameId: id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          })

          const gameTime = gameCheck.updatedAt.getTime()
          const msgTime = lastMsg?.createdAt.getTime() || 0
          const partyTime = lastPartyMsg?.createdAt.getTime() || 0
          
          const currentMax = Math.max(gameTime, msgTime, partyTime)

          if (currentMax > lastUpdate) {
            lastUpdate = currentMax
            
            // Fetch full payload to send to client
            // Optimization: In a real app, send delta. Here, send full/partial state.
            // Client expects standard GameResponse structure
            
            const gameFull = await prisma.game.findUnique({
              where: { id },
              include: {
                messages: { 
                  orderBy: { createdAt: 'asc' },
                  include: { character: true } 
                }, 
                characters: { include: { character: true } },
                partyMessages: {
                    orderBy: { createdAt: 'asc' },
                    include: { character: true },
                    take: 50
                }
              },
            })
            
            if (gameFull) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(gameFull)}\n\n`))
            }
          } else {
             // Send heartbeat
             controller.enqueue(encoder.encode(': heartbeat\n\n'))
          }

        } catch (err) {
            console.error('Stream error', err)
            controller.close()
            clearInterval(interval)
        }
      }, 1000) // Poll every 1s
      
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
