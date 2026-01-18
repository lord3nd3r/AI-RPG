'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

interface Character {
  id: string
  name: string
  class: string
  stats: string
  currentHp?: number
  maxHp?: number
  level?: number
  exp?: number
  statusEffects?: string
}

interface GameResponse {
  id: string
  name: string
  description?: string
  aiProvider: string
  messages: Message[]
  characters: Array<{
    character: Character
    currentHp?: number
    maxHp?: number
    level?: number
    exp?: number
    statusEffects?: string
  }>
}

interface PartyMessage {
  id: string
  content: string
  character: { name: string, id: string }
  createdAt: string
  characterId: string
}

export default function GameClient({ id }: { id: string }) {
  const [game, setGame] = useState<GameResponse | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [partyMessages, setPartyMessages] = useState<PartyMessage[]>([])
  const [input, setInput] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchGameData = useCallback(async () => {
    try {
      console.debug('[GameClient] fetching game data for id=', id)
      const res = await fetch(`/api/games/${id}`, { credentials: 'same-origin' })
      if (res.status === 401) {
        setErrorMessage('You must be signed in to access this game.')
        return
      }
      if (res.status === 404) {
        setErrorMessage('Game not found or is unavailable.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch')

      const data: GameResponse = await res.json()
      setGame(data)
      setMessages(data.messages || [])
      setCharacters((data.characters || []).map((c) => ({ ...c.character, currentHp: c.currentHp, maxHp: c.maxHp, level: c.level, exp: c.exp, statusEffects: c.statusEffects })))
      setErrorMessage(null)
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to load game data')
    }
  }, [id])

  const fetchChat = useCallback(async () => {
    try {
        const res = await fetch(`/api/games/${id}/party-chat`)
        if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) setPartyMessages(data)
        }
    } catch (e) { console.error('Chat fetch error', e) }
  }, [id])

  useEffect(() => {
    fetchGameData()
    fetchChat()
    const interval = setInterval(() => {
        fetchGameData()
        fetchChat()
    }, 2000)
    return () => clearInterval(interval)
  }, [fetchGameData, fetchChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [partyMessages])

  const sendPartyMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!chatInput.trim()) return
    const msg = chatInput
    setChatInput('')
    try {
        await fetch(`/api/games/${id}/party-chat`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ message: msg }) 
        })
        fetchChat()
    } catch (err) { console.error(err) }
  }

  const copyInvite = () => {
    const url = window.location.href
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => alert('Game link copied! Share it with your friends.'))
        .catch((err) => {
          console.error(err)
          prompt('Copy this invite link:', url)
        })
    } else {
       // Fallback for insecure contexts (like HTTP local IP)
       prompt('Copy this invite link:', url)
    }
  }

  const sendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input
    setInput('')
    setLoading(true)

    // Optimistic update
    const tempId = Date.now().toString()
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMsg, createdAt: new Date().toISOString() }])

    try {
      const res = await fetch(`/api/games/${id}/chat`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      if (!res.ok) throw new Error('Failed')
      await fetchGameData()
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (errorMessage) return <div className="p-8 text-center text-red-500">{errorMessage}</div>
  if (!game) return <div className="p-8 text-center">Loading realm...</div>

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full border-r border-muted">
        <div className="p-6 border-b border-muted bg-card shadow-sm z-10 rpg-banner flex items-center gap-4">
          <div className="w-40 h-16 relative">
            <Image src="/icons/parchment.svg" alt="parchment" fill sizes="160px" style={{ objectFit: 'cover', borderRadius: 8 }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-extrabold text-foreground">{game.name}</h1>
               <button onClick={copyInvite} className="bg-primary/10 hover:bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30 transition-colors" title="Copy Invite Link">
                 ✉️ Invite
               </button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{game.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start fade-in'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card chat-assistant text-card-foreground border border-muted rounded-bl-none'}`}>
                {msg.role === 'assistant' && <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Dungeon Master</div>}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-[10px] opacity-70 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 text-sm italic animate-pulse">The DM is thinking...</div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-card border-t border-muted">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="What do you want to do?" className="flex-1 bg-background text-foreground border border-muted rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" disabled={loading} autoFocus />
            <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:brightness-90 transition-all disabled:opacity-50">Send</button>
          </form>
        </div>
      </div>

      <div className="w-80 bg-muted/30 border-l border-muted hidden lg:flex flex-col h-full">
        <div className="p-4 overflow-y-auto max-h-[50%] border-b border-muted">
            <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider">Party Status</h2>
            <div className="space-y-4">
            {characters.map((char) => (
                <div key={char.id} className="bg-card p-4 rounded-lg shadow-sm border border-muted">
                <div className="flex justify-between items-start mb-2">
                    <div>
                    <h3 className="font-bold text-foreground">{char.name}</h3>
                    <p className="text-xs text-muted-foreground">{char.class} - Lvl {char.level || 1}</p>
                    </div>
                    <div className="text-right">
                    <div className={`text-sm font-bold ${char.currentHp && char.maxHp ? (char.currentHp < (char.maxHp/4) ? 'text-red-500' : char.currentHp < (char.maxHp/2) ? 'text-orange-500' : 'text-green-500') : 'text-muted-foreground'}`}>HP {char.currentHp ?? '-'} / {char.maxHp ?? '-'}</div>
                    <div className="text-[10px] text-muted-foreground">XP: {char.exp ?? 0}</div>
                    </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${char.currentHp && char.maxHp ? Math.max(0, Math.min(100, (char.currentHp/char.maxHp)*100)) : 0}%` }} />
                </div>

                <div className="text-xs text-muted-foreground">{(() => { try { const arr = JSON.parse(char.statusEffects || '[]'); return Array.isArray(arr) && arr.length ? arr.join(', ') : 'No effects' } catch { return 'No effects' } })()}</div>
                </div>
            ))}
            </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
            <div className="p-3 border-b border-muted bg-muted/20">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Party Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {partyMessages.length === 0 && <div className="text-xs text-muted-foreground text-center italic mt-4">No chatter yet...</div>}
                {partyMessages.map(pm => (
                    <div key={pm.id} className="text-sm">
                        <span className="font-bold text-primary mr-1">{pm.character.name}:</span>
                        <span className="text-foreground">{pm.content}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendPartyMessage} className="p-3 border-t border-muted bg-card">
                <input 
                    className="w-full bg-muted/50 border border-muted rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Chat as your character..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                />
            </form>
        </div>
      </div>
    </div>
  )
}
