'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Game {
  id: string
  name: string
  description: string
  dmUserId: string
  isPublic: boolean
  maxPlayers: number
  characterCount: number
}

interface Character {
  id: string
  name: string
  class: string
}

export default function LobbyPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedChar, setSelectedChar] = useState<string | null>(null)

  useEffect(() => {
    fetchLobbyData()
  }, [])

  const fetchLobbyData = async () => {
    try {
      const res = await fetch('/api/lobby')
      if (res.ok) {
        const data = await res.json()
        setGames(data.games)
        setCharacters(data.characters)
      }
    } catch (error) {
      console.error('Failed to fetch lobby', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!selectedGame || !selectedChar) return

    try {
      const res = await fetch(`/api/games/${selectedGame}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedChar })
      })

      if (res.ok) {
        router.push(`/games/${selectedGame}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to join')
      }
    } catch (error) {
      console.error(error)
      alert('Failed to join')
    }
  }

  if (loading) return <div className="p-8">Loading Lobby...</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Public Games</h1>
        <Link href="/games/create" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Create New Game
        </Link>
      </div>

      <div className="grid gap-4">
        {games.length === 0 ? (
          <p className="text-muted-foreground">No public games active right now.</p>
        ) : (
          games.map((game) => (
            <div key={game.id} className="border p-4 rounded-lg flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-xl">{game.name}</h3>
                <p className="text-muted-foreground">{game.description || 'No description'}</p>
                <div className="text-xs mt-1 bg-secondary inline-block px-2 py-1 rounded">
                   Players: {game.characterCount} / {game.maxPlayers}
                </div>
              </div>
              <button
                onClick={() => setSelectedGame(game.id)}
                className="bg-accent text-accent-foreground px-4 py-2 rounded hover:opacity-90 transition"
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>

      {selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Select Character</h2>
            <div className="space-y-2 mb-4">
              {characters.map(char => (
                <div 
                  key={char.id}
                  onClick={() => setSelectedChar(char.id)}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedChar === char.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                  }`}
                >
                  <p className="font-bold">{char.name}</p>
                  <p className="text-xs text-muted-foreground">{char.class}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setSelectedGame(null)}
                className="px-4 py-2 hover:bg-muted rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoin}
                disabled={!selectedChar}
                className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
              >
                Enter Realm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
