import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <div>Please sign in</div>
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      characters: true,
      games: true,
    },
  })

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>
        
        <div className="mb-8">
           <Link href="/lobby" className="block w-full text-center bg-accent text-accent-foreground text-xl font-bold py-4 rounded-lg hover:bg-accent/90 transition shadow-lg border border-accent">
             ⚔️ Enter Multiplayer Lobby 🛡️
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Characters</h2>
            <div className="space-y-4">
              {user?.characters.map((character) => (
                <div key={character.id} className="bg-card text-card-foreground p-4 rounded-lg shadow border border-muted">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{character.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {character.class}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(JSON.parse(character.stats)).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/characters/create" className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded">
              Create Character
            </Link>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Games</h2>
            <div className="space-y-4">
              {user?.games.map((game) => (
                <div key={game.id} className="bg-card text-card-foreground p-4 rounded-lg shadow border border-muted">
                  <h3 className="text-lg font-medium">{game.name}</h3>
                  <p className="text-muted-foreground">{game.description}</p>
                  <p className="text-sm text-muted-foreground">AI: {game.aiProvider}</p>
                  <Link href={`/games/${game.id}`} className="mt-4 block w-full text-center bg-secondary text-secondary-foreground py-2 rounded hover:brightness-95 transition-all">
                    Play Game
                  </Link>
                </div>
              ))}
            </div>
            <Link href="/games/create" className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded">
              Create Game
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}