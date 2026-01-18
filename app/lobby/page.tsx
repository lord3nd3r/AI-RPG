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

  if (loading) return (
     <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
     </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 relative overflow-x-hidden">
       {/* Bg effects */}
       <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
       
       <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-12 gap-4 border-b border-indigo-900/30 pb-6">
            <div>
               <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Public Realms</h1>
               <p className="text-slate-400 mt-2">Join an adventure in progress or create your own legend.</p>
            </div>
            <Link href="/games/create" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
               <span>Create New Saga</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {games.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-2xl border border-dotted border-slate-800">
                   <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                   <p className="text-slate-500 text-lg">No active realms found. Be the first to forge one!</p>
                </div>
             ) : (
                games.map((game) => (
                  <div key={game.id} className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                           <h3 className="font-bold text-xl text-slate-100 group-hover:text-indigo-300 transition-colors">{game.name}</h3>
                           <span className="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400">
                             {game.characterCount}/{game.maxPlayers}
                           </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">{game.description || 'A mysterious realm awaits...'}</p>
                        
                        <button
                          onClick={() => setSelectedGame(game.id)}
                          className="w-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                           <span>Join Quest</span>
                        </button>
                     </div>
                  </div>
                ))
             )}
          </div>
       </div>

       {/* Modal */}
       {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button 
               onClick={() => setSelectedGame(null)}
               className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Select Your Hero</h2>
            <p className="text-slate-400 text-sm mb-6">Choose who will enter this realm.</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {characters.length === 0 ? (
                 <div className="text-center py-8 text-slate-500">
                    <p>No heroes found.</p>
                    <Link href="/characters/create" className="text-indigo-400 hover:underline mt-2 inline-block">Create one first</Link>
                 </div>
              ) : (
                characters.map(char => (
                  <button 
                    key={char.id}
                    onClick={() => setSelectedChar(char.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                      selectedChar === char.id 
                      ? 'bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500/50' 
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedChar === char.id ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                       <span className="font-bold text-white uppercase">{char.name[0]}</span>
                    </div>
                    <div>
                        <p className={`font-bold ${selectedChar === char.id ? 'text-indigo-200' : 'text-slate-200'}`}>{char.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{char.class}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setSelectedGame(null)}
                className="flex-1 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Retreat
              </button>
              <button 
                onClick={handleJoin}
                disabled={!selectedChar}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
