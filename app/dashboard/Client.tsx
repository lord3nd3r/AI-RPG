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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Your Characters</h2>
            <button onClick={() => window.location.href = '/characters/create'} className="bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
          </div>

          <div className={`${loading ? 'flex' : 'grid grid-cols-1 lg:grid-cols-2'} gap-4`}>
            {loading ? <div className="text-muted-foreground italic p-4">Summoning characters...</div> : characters.map((c) => (
              <div key={c.id} className="bg-card p-6 rounded-xl shadow-md flex flex-col justify-between border border-muted hover:border-primary/50 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{c.name}</h3>
                    <div className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded mt-1 inline-block">{c.class}</div>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-4 border-t border-muted/50 justify-end">
                  <button onClick={() => { setEditingChar(c); setEditCharOpen(true) }} className="px-3 py-1.5 text-sm bg-accent text-accent-foreground rounded-md hover:brightness-90 transition">Edit</button>
                  <button onClick={() => setConfirmDeleteCharId(c.id)} className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-red-700 transition text-white">Delete</button>
                </div>
              </div>
            ))}
            {!loading && characters.length === 0 && (
              <div className="col-span-full text-center py-10 border-2 border-dashed border-muted rounded-xl">
                <p className="text-muted-foreground mb-4">No heroes found.</p>
                <button onClick={() => window.location.href = '/characters/create'} className="text-primary hover:underline">Create your first character</button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Your Games</h2>
            <button onClick={() => window.location.href = '/games/create'} className="bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
          </div>

          <div className={`${loading ? 'flex' : 'grid grid-cols-1 lg:grid-cols-2'} gap-4`}>
            {loading ? <div className="text-muted-foreground italic p-4">Discovering realms...</div> : games.map((g) => (
              <div key={g.id} className="bg-card p-6 rounded-xl shadow-md flex flex-col justify-between border border-muted hover:border-primary/50 transition-all group">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-1" title={g.name}>{g.name}</h3>
                    {g.isPublic && <span className="text-[10px] uppercase font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20">Public</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[2.5em]">{g.description || "A mysterious land awaiting exploration..."}</div>
                </div>
                
                <div className="flex gap-2 mt-auto pt-4 border-t border-muted/50 justify-between items-center">
                  <span className="text-xs text-muted-foreground font-mono">👥 {g.maxPlayers || 4} Max</span>
                  <div className="flex gap-2">
                    <a href={`/games/${g.id}`} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:brightness-110 shadow-sm transition">Play</a>
                    <button onClick={() => { setEditingGame(g); setEditGameOpen(true) }} className="px-3 py-1.5 text-sm bg-accent text-accent-foreground rounded-md hover:brightness-90 transition">Edit</button>
                    <button onClick={() => setConfirmDeleteGameId(g.id)} className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-red-700 transition text-white">Delete</button>
                  </div>
                </div>
              </div>
            ))}
             {!loading && games.length === 0 && (
              <div className="col-span-full text-center py-10 border-2 border-dashed border-muted rounded-xl">
                <p className="text-muted-foreground mb-4">No realms created.</p>
                <button onClick={() => window.location.href = '/games/create'} className="text-primary hover:underline">Create a new game</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal title="Edit Character" open={editCharOpen} onClose={() => setEditCharOpen(false)}>
        {editingChar && (
          <form onSubmit={(e) => { e.preventDefault(); saveChar(editingChar) }} className="space-y-3">
            <div>
              <label className="block text-sm">Name</label>
              <input value={editingChar.name} onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })} className="mt-1 block w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Class</label>
              <input value={editingChar.class} onChange={(e) => setEditingChar({ ...editingChar, class: e.target.value })} className="mt-1 block w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditCharOpen(false)} className="px-4 py-2">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">Save</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal title="Edit Game" open={editGameOpen} onClose={() => setEditGameOpen(false)}>
        {editingGame && (
          <form onSubmit={(e) => { e.preventDefault(); saveGame(editingGame) }} className="space-y-3">
            <div>
              <label className="block text-sm">Name</label>
              <input value={editingGame.name} onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} className="mt-1 block w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Description</label>
              <input value={editingGame.description || ''} onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })} className="mt-1 block w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex gap-2 items-center">
              <input type="checkbox" checked={!!editingGame.isPublic} onChange={(e) => setEditingGame({ ...editingGame, isPublic: e.target.checked })} /> <label className="text-sm">Public</label>
              <input type="number" value={editingGame.maxPlayers || 4} onChange={(e) => setEditingGame({ ...editingGame, maxPlayers: Number(e.target.value) })} className="ml-4 w-20 border px-2 py-1 rounded" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditGameOpen(false)} className="px-4 py-2">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">Save</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal open={!!confirmDeleteCharId} title="Delete Character" description="Delete this character? This cannot be undone." onConfirm={confirmDeleteChar} onCancel={() => setConfirmDeleteCharId(null)} />

      <ConfirmModal open={!!confirmDeleteGameId} title="Delete Game" description="Delete this game? This cannot be undone." onConfirm={confirmDeleteGame} onCancel={() => setConfirmDeleteGameId(null)} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
