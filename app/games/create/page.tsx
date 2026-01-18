'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Character {
  id: string
  name: string
  stats: string
}

interface AIProviderOption {
  id: string
  name: string
}

export default function CreateGame() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [aiProvider, setAiProvider] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [providers, setProviders] = useState<AIProviderOption[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // Fetch available providers first
    fetch('/api/config/ai')
      .then(res => res.json())
      .then((data: AIProviderOption[]) => {
        setProviders(data)
        if (data.length > 0) {
          setAiProvider(data[0].id)
        }
      })

    fetch('/api/characters')
      .then(res => res.json())
      .then(data => setCharacters(data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, aiProvider, isPublic, maxPlayers }),
    })
    if (response.ok) {
      const game = await response.json()
      // Assign characters to game
      for (const charId of selectedCharacters) {
        await fetch(`/api/games/${game.id}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: charId }),
        })
      }
      router.push('/dashboard')
    } else {
      alert('Error creating game')
    }
  }

  const toggleCharacter = (id: string) => {
    setSelectedCharacters(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow border border-muted">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Create Game</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border-muted bg-background text-foreground rounded-md shadow-sm px-3 py-2 border"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border-muted bg-background text-foreground rounded-md shadow-sm px-3 py-2 border"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground">AI Provider</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="mt-1 block w-full border-muted bg-background text-foreground rounded-md shadow-sm px-3 py-2 border"
              disabled={providers.length === 0}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              {providers.length === 0 && <option>No AI Providers Configured</option>}
            </select>
            {providers.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                Please configure API keys in .env
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-muted bg-background text-primary"
            />
            <label htmlFor="isPublic" className="text-sm font-medium text-foreground">
              Public Game (Allows anyone to join)
            </label>
          </div>

          {isPublic && (
            <div>
              <label className="block text-sm font-medium text-foreground">Max Players</label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="mt-1 block w-full border-muted bg-background text-foreground rounded-md shadow-sm px-3 py-2 border"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Select Characters</label>
            <div className="space-y-2">
              {characters.map((char) => (
                <label key={char.id} className="flex items-center text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(char.id)}
                    onChange={() => toggleCharacter(char.id)}
                    className="mr-2"
                  />
                  {char.name}
                </label>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:brightness-90 transition-all font-medium"
          >
            Create Game
          </button>
        </form>
      </div>
    </div>
  )
}