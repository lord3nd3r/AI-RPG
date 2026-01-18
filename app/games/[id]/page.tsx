'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  currentHp: number
  maxHp: number
  level: number
  exp: number
  statusEffects: string
}

interface Game {
  id: string;
  name: string;
  description: string;
  aiProvider: string;
}

export default function GamePage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<Game | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Use id directly from props, assuming params are synchronous in this context or handle specifically.
  // In Next.js 13+ App Router, basic params are passed as props.
  const id = params.id as string

  const fetchGameData = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${id}`)
      if (!res.ok) throw new Error('Game not found')
      const data = await res.json()
      setGame(data)
      setMessages(data.messages || [])
      setCharacters(data.characters.map((c: any) => ({
        ...c.character,
        ...c // merge game stats like currentHp
      })))
    } catch (error) {
      console.error(error)
    }
  }, [id])

  useEffect(() => {
    fetchGameData()
    const interval = setInterval(fetchGameData, 3000)
    return () => clearInterval(interval)
  }, [fetchGameData])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      
      if (!res.ok) throw new Error('Failed to send message')
      
      // Refresh state to get AI response and updated statuses
      await fetchGameData()
    } catch (error) {
      console.error(error)
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (!game) return <div className="p-8 text-center">Loading realm...</div>

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full border-r border-muted">
        <div className="p-4 border-b border-muted bg-card shadow-sm z-10">
          <h1 className="text-xl font-bold text-foreground">{game.name}</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">{game.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-card-foreground border border-muted rounded-bl-none'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Dungeon Master</div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-[10px] opacity-70 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 text-sm italic animate-pulse">
                The DM is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-card border-t border-muted">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you want to do?"
              className="flex-1 bg-background text-foreground border border-muted rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:brightness-90 transition-all disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar - Character Sheets */}
      <div className="w-80 bg-muted/30 border-l border-muted overflow-y-auto p-4 hidden lg:block">
        <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider">Party Status</h2>
        <div className="space-y-4">
          {characters.map((char) => (
            <div key={char.id} className="bg-card p-4 rounded-lg shadow-sm border border-muted">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-foreground">{char.name}</h3>
                  <p className="text-xs text-muted-foreground">{char.class} - Lvl {char.level}</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    char.currentHp < char.maxHp / 4 ? 'text-red-500' : 
                    char.currentHp < char.maxHp / 2 ? 'text-orange-500' : 'text-green-500'
                  }`}>
                    HP {char.currentHp}/{char.maxHp}
                  </div>
                  <div className="text-[10px] text-muted-foreground">XP: {char.exp}</div>
                </div>
              </div>

              {/* Health Bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, (char.currentHp / char.maxHp) * 100))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                {char.stats && Object.entries(JSON.parse(char.stats)).map(([key, value]) => (
                   ['strength', 'dexterity', 'wisdom', 'constitution', 'intelligence', 'charisma'].includes(key) ? (
                    <div key={key} className="flex justify-between capitalize">
                      <span>{key.substring(0, 3)}</span>
                      <span className="font-mono text-foreground">{String(value)}</span>
                    </div>
                  ) : null
                ))}
              </div>

              {/* Status Effects */}
              <div className="flex flex-wrap gap-1">
                {JSON.parse(char.statusEffects || '[]').map((effect: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full font-medium border border-yellow-200">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
