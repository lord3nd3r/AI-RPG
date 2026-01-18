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
    <div className="min-h-screen py-12 flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="max-w-xl w-full mx-auto bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/5 relative z-10">
        <div className="text-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg shadow-purple-900/50 mb-4 animate-bounce-slow">
                🌌
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200 uppercase tracking-tight">Construct Realm</h1>
            <p className="text-slate-500 mt-2 text-sm">Weave a new reality for you and your allies.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Realm Name</label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
                placeholder="The Shadowed Vale..."
                required
                />
            </div>
          
            <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Description</label>
                <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all min-h-[100px] resize-none"
                placeholder="A world where magic is dying..."
                />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Dungeon Master AI</label>
            <div className="relative">
                <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                disabled={providers.length === 0}
                >
                {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                    {p.name}
                    </option>
                ))}
                {providers.length === 0 && <option>No AI Providers Configured</option>}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
            </div>
            {providers.length === 0 && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span> Please configure API keys in .env
              </p>
            )}
          </div>
          
          <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                    <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <label htmlFor="isPublic" className="text-sm font-bold text-slate-300 cursor-pointer select-none">
                    Public Realm
                    </label>
                </div>
                 {isPublic && (
                    <div className="flex items-center gap-2 animate-fade-in-left">
                    <label className="text-xs font-bold text-slate-500 uppercase">Max Players</label>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg text-center text-white py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    </div>
                )}
            </div>
            {isPublic && (
                <p className="text-xs text-slate-500 ml-8 mb-2">
                    Anyone will be able to join via the Multiplayer Lobby.
                </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                <span>Initial Party</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">{selectedCharacters.length} Selected</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {characters.map((char) => (
                <label key={char.id} className={`
                    flex items-center p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedCharacters.includes(char.id) 
                        ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_10px_rgba(147,51,234,0.1)]' 
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}
                `}>
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(char.id)}
                    onChange={() => toggleCharacter(char.id)}
                    className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-950 mr-3"
                  />
                  <span className={`text-sm font-medium ${selectedCharacters.includes(char.id) ? 'text-purple-200' : 'text-slate-400'}`}>
                      {char.name}
                  </span>
                </label>
              ))}
              {characters.length === 0 && (
                  <div className="col-span-full text-center text-slate-500 py-4 italic text-sm">No heroes available to summon.</div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Create Realm
          </button>
        </form>
      </div>
    </div>
  )
}