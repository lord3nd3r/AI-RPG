'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'

interface Character {
  id: string
  name: string
  class: string
  stats: string
}

interface Game {
  id: string
  name: string
  description?: string
  aiProvider: string
  isPublic?: boolean
  maxPlayers?: number
}

export default function DashboardClient() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const [toast, setToast] = useState<{ message: string; type?: 'success'|'error'|'info' } | null>(null)

  const [editCharOpen, setEditCharOpen] = useState(false)
  const [editingChar, setEditingChar] = useState<Character | null>(null)

  const [confirmDeleteCharId, setConfirmDeleteCharId] = useState<string | null>(null)

  const [editGameOpen, setEditGameOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [confirmDeleteGameId, setConfirmDeleteGameId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/me')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCharacters(data.characters || [])
      setGames(data.games || [])
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to load data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function saveChar(ch: Character) {
    try {
      const res = await fetch(`/api/characters/${ch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ch.name, class: ch.class })
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setCharacters(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditCharOpen(false)
      setToast({ message: 'Character updated', type: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to update character', type: 'error' })
    }
  }

  async function confirmDeleteChar() {
    const id = confirmDeleteCharId
    if (!id) return
    try {
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setCharacters(prev => prev.filter(p => p.id !== id))
      setConfirmDeleteCharId(null)
      setToast({ message: 'Character deleted', type: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to delete character', type: 'error' })
    }
  }

  async function saveGame(g: Game) {
    try {
      const res = await fetch(`/api/games/${g.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: g.name, description: g.description, isPublic: g.isPublic, maxPlayers: g.maxPlayers })
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setGames(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditGameOpen(false)
      setToast({ message: 'Game updated', type: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to update game', type: 'error' })
    }
  }

  async function confirmDeleteGame() {
    const id = confirmDeleteGameId
    if (!id) return
    try {
      const res = await fetch(`/api/games/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setGames(prev => prev.filter(p => p.id !== id))
      setConfirmDeleteGameId(null)
      setToast({ message: 'Game deleted', type: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ message: 'Failed to delete game', type: 'error' })
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Characters Section */}
        <div className="relative">
           <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl -z-10"></div>
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Heroes</span>
               <span className="text-sm font-normal text-slate-500 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full">{characters.length}</span>
            </h2>
            <button 
              onClick={() => window.location.href = '/characters/create'} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-400/30 font-medium flex items-center gap-2"
            >
              <span className="text-lg">+</span> Create Solution
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700/50"></div>
                ))
            ) : characters.map((c) => (
              <div key={c.id} className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all group relative overflow-hidden backdrop-blur-md shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                        👤
                     </div>
                     <div>
                        <h3 className="font-bold text-xl text-slate-100 group-hover:text-indigo-300 transition-colors">{c.name}</h3>
                        <div className="text-xs font-mono text-indigo-300 bg-indigo-900/30 border border-indigo-500/30 px-2 py-1 rounded mt-1 inline-block uppercase tracking-wider">{c.class}</div>
                     </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1">
                     <button onClick={() => { setEditingChar(c); setEditCharOpen(true) }} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                        ✏️
                     </button>
                     <button onClick={() => setConfirmDeleteCharId(c.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                        🗑️
                     </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && characters.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl bg-slate-900/40 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-1000"></div>
                <div className="text-5xl mb-4 opacity-20 group-hover:opacity-40 transition-opacity">🛡️</div>
                <p className="text-slate-400 mb-6 font-medium">Your legend has yet to be written.</p>
                <button 
                    onClick={() => window.location.href = '/characters/create'} 
                    className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/30 hover:decoration-indigo-500 underline-offset-4"
                >
                    Forge your first hero
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Games Section */}
        <div className="relative">
          <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl -z-10"></div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Realms</span>
                <span className="text-sm font-normal text-slate-500 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full">{games.length}</span>
            </h2>
            <button 
               onClick={() => window.location.href = '/games/create'} 
               className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] border border-purple-400/30 font-medium flex items-center gap-2"
            >
               <span className="text-lg">+</span> Create Realm
            </button>
          </div>

          <div className="space-y-4">
             {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700/50"></div>
                ))
            ) : games.map((g) => (
              <div key={g.id} className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all group relative overflow-hidden backdrop-blur-md shadow-lg flex flex-col h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all pointer-events-none"></div>
                
                <div className="mb-4 relative z-10 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl text-slate-100 group-hover:text-purple-300 transition-colors truncate pr-4">{g.name}</h3>
                    {g.isPublic && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            Public
                        </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{g.description || "A mysterious shard of the multiverse..."}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-slate-700 rounded-full group-hover:bg-purple-500/50 transition-colors"></span>
                    {g.maxPlayers || 4} Max Players
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingGame(g); setEditGameOpen(true) }} className="p-2 text-slate-500 hover:text-white transition-colors" title="Settings">
                       <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </button>
                    <button onClick={() => setConfirmDeleteGameId(g.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                       <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <a href={`/games/${g.id}`} className="ml-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(147,51,234,0.3)] transition-all hover:scale-105 border border-white/10">
                        Enter World
                    </a>
                  </div>
                </div>
              </div>
            ))}
             {!loading && games.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl bg-slate-900/40 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-1000"></div>
                <div className="text-5xl mb-4 opacity-20 group-hover:opacity-40 transition-opacity">🌍</div>
                <p className="text-slate-400 mb-6 font-medium">No worlds discovered yet.</p>
                <button 
                  onClick={() => window.location.href = '/games/create'} 
                  className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/30 hover:decoration-purple-500 underline-offset-4"
                >
                  Create a new realm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styled Modals */}
      <Modal title="Edit Character" open={editCharOpen} onClose={() => setEditCharOpen(false)}>
        {editingChar && (
          <form onSubmit={(e) => { e.preventDefault(); saveChar(editingChar) }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input 
                value={editingChar.name} 
                onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Class</label>
              <input 
                value={editingChar.class} 
                onChange={(e) => setEditingChar({ ...editingChar, class: e.target.value })} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
              <button type="button" onClick={() => setEditCharOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal title="Edit Game" open={editGameOpen} onClose={() => setEditGameOpen(false)}>
        {editingGame && (
          <form onSubmit={(e) => { e.preventDefault(); saveGame(editingGame) }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Realm Name</label>
              <input 
                value={editingGame.name} 
                onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea 
                value={editingGame.description || ''} 
                onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors h-24" 
              />
            </div>
            <div className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="isPublic"
                    checked={!!editingGame.isPublic} 
                    onChange={(e) => setEditingGame({ ...editingGame, isPublic: e.target.checked })} 
                    className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-800"
                  /> 
                  <label htmlFor="isPublic" className="ml-2 text-sm text-slate-300 cursor-pointer">Public Realm</label>
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Max Players:</label>
                  <input 
                    type="number" 
                    value={editingGame.maxPlayers || 4} 
                    onChange={(e) => setEditingGame({ ...editingGame, maxPlayers: Number(e.target.value) })} 
                    className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-purple-500" 
                  />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
              <button type="button" onClick={() => setEditGameOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal 
        open={!!confirmDeleteCharId} 
        title="Delete Hero" 
        description="Are you sure you want to banish this hero to the void? This action cannot be undone." 
        onConfirm={confirmDeleteChar} 
        onCancel={() => setConfirmDeleteCharId(null)} 
      />

      <ConfirmModal 
        open={!!confirmDeleteGameId} 
        title="Destroy Realm" 
        description="Are you sure you want to collapse this timeline? All progress will be lost forever." 
        onConfirm={confirmDeleteGame} 
        onCancel={() => setConfirmDeleteGameId(null)} 
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
