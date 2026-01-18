'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import InventoryButton from '@/components/InventoryButton'

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
  currentMp?: number
  maxMp?: number
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
  partyMessages?: PartyMessage[]
  characters: Array<{
    character: Character
    currentHp?: number
    maxHp?: number
    currentMp?: number
    maxMp?: number
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
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    shouldAutoScroll.current = isAtBottom
  }

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
      setCharacters((data.characters || []).map((c) => ({
        ...c.character,
        currentHp: c.currentHp,
        maxHp: c.maxHp,
        currentMp: c.currentMp,
        maxMp: c.maxMp,
        level: c.level,
        exp: c.exp,
        statusEffects: c.statusEffects
      })))
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

  const fetchMyCharacter = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${id}/characters`)
      if (!res.ok) return
      const data = await res.json()
      if (data && data.characterId) setMyCharacterId(data.characterId)
    } catch { 
      // ignore
    }
  }, [id])

  useEffect(() => {
    fetchGameData()
    fetchChat()
    fetchMyCharacter()

    const eventSource = new EventSource(`/api/games/${id}/stream`)
    
    eventSource.onmessage = (event) => {
      try {
        const data: GameResponse = JSON.parse(event.data)
        setGame(data)
        setMessages(data.messages || [])
        setCharacters((data.characters || []).map((c) => ({
          ...c.character,
          currentHp: c.currentHp,
          maxHp: c.maxHp,
          currentMp: c.currentMp,
          maxMp: c.maxMp,
          level: c.level,
          exp: c.exp,
          statusEffects: c.statusEffects
        })))
        if (data.partyMessages) {
          setPartyMessages(data.partyMessages)
        }
      } catch {
        // Ignore heartbeat/ping parse errors
      }
    }

    eventSource.onerror = () => {
      console.log('SSE connection lost, retrying...')
      // eventSource auto-reconnects
    }

    return () => {
      eventSource.close()
    }
  }, [id, fetchGameData, fetchChat, fetchMyCharacter])

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
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
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 overflow-hidden">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full border-r border-slate-800 shadow-[20px_0_50px_rgba(0,0,0,0.5)] relative">
        {/* Header Ribbon */}
        <div className="p-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md z-20 flex items-center gap-6 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
           <div className="relative group cursor-pointer">
                <div className="absolute -inset-2 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Image src="/icons/parchment.svg" alt="parchment" width={60} height={60} className="relative drop-shadow-md transform group-hover:scale-105 transition-transform" />
           </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-1">
               <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 font-serif tracking-wide drop-shadow-sm">{game.name}</h1>
               <button onClick={copyInvite} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30 transition-all hover:scale-105 flex items-center gap-2" title="Copy Invite Link">
                 <span>🔗</span> Invoke Ally
               </button>
            </div>
            <p className="text-sm text-slate-400 line-clamp-1 italic border-l-2 border-slate-700 pl-3">{game.description || "A tale untold..."}</p>
          </div>
        </div>

        {/* Chat Scrolling Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start fade-in'}`}>
              <div className={`
                relative max-w-[85%] rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm border
                ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 text-indigo-100 border-indigo-500/30 rounded-br-none' 
                    : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 text-slate-300 border-slate-700/50 rounded-bl-none shadow-[0_0_15px_rgba(0,0,0,0.3)]'}
              `}>
                {msg.role === 'assistant' && (
                    <div className="absolute -top-3 -left-2 bg-slate-950 border border-amber-900/50 text-amber-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Dungeon Master
                    </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</div>
                <div className="text-[10px] opacity-40 mt-2 text-right font-mono tracking-tighter">{new Date(msg.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
                 <div className="bg-slate-900/50 border border-slate-800 text-slate-400 rounded-xl px-4 py-2 text-sm italic animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    The DM is weaving the fate...
                 </div>
             </div>
           )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/80 border-t border-white/5 backdrop-blur-md relative z-20">
          <form onSubmit={sendMessage} className="flex gap-3 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none"></div>
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Declare your action..." 
                className="flex-1 bg-slate-950/50 text-slate-100 border border-slate-700 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-600 shadow-inner" 
                disabled={loading} 
                autoFocus 
            />
            <button 
                type="submit" 
                disabled={loading} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 bg-size-200 bg-pos-0 hover:bg-pos-100"
            >
                Act
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar - Party Status & Chat */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col h-full shadow-2xl z-20 relative">
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>

         {/* Party Stats */}
        <div className="p-4 overflow-y-auto max-h-[55%] border-b border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
            <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="text-xl">🛡️</span> Party Status
            </h2>
            <div className="space-y-3">
            {characters.map((char) => (
                <div key={char.id} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 shadow-lg backdrop-blur-sm group hover:bg-slate-800/60 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                        <h3 className="font-bold text-slate-200 text-sm group-hover:text-indigo-300 transition-colors">{char.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{char.class} • Lvl {char.level || 1}</p>
                        </div>
                        <div className="text-right">
                         <div className="text-[10px] text-slate-400 font-mono">XP: {char.exp ?? 0}</div>
                         {myCharacterId === char.id && (
                           <div className="mt-2">
                             <InventoryButton gameId={id} characterId={char.id} />
                           </div>
                         )}
                        </div>
                    </div>

                    {/* HP Bar */}
                    <div className="mb-2">
                         <div className="flex justify-between text-[10px] mb-1 font-bold">
                             <span className="text-red-400">HP</span>
                             <span className="text-slate-400">{char.currentHp ?? '-'} / {char.maxHp ?? '-'}</span>
                         </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                                    (char.currentHp && char.maxHp && char.currentHp < char.maxHp * 0.3) ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-red-600 to-red-500'
                                }`} 
                                style={{ width: `${char.currentHp && char.maxHp ? Math.max(0, Math.min(100, (char.currentHp/char.maxHp)*100)) : 0}%` }} 
                            >
                                <div className="absolute inset-0 bg-white/20"></div>
                            </div>
                        </div>
                    </div>

                    {/* MP Bar */}
                    <div className="mb-3">
                         <div className="flex justify-between text-[10px] mb-1 font-bold">
                             <span className="text-blue-400">MP</span>
                             <span className="text-slate-400">{char.currentMp ?? '-'} / {char.maxMp ?? '-'}</span>
                         </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-700 ease-out relative" 
                                style={{ width: `${char.currentMp && char.maxMp ? Math.max(0, Math.min(100, (char.currentMp/char.maxMp)*100)) : 0}%` }} 
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_5px_white]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Status Effects */}
                    <div className="text-[10px] text-slate-500 flex flex-wrap gap-1">
                        {(() => { 
                            try { 
                                const arr = JSON.parse(char.statusEffects || '[]'); 
                                return Array.isArray(arr) && arr.length 
                                    ? arr.map((eff: string, i: number) => (
                                        <span key={i} className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">{eff}</span>
                                      ))
                                    : <span className="opacity-50 italic">Normal state</span>
                            } catch { return <span className="opacity-50 italic">Normal state</span> } 
                        })()}
                    </div>
                </div>
            ))}
            </div>
        </div>
        
        {/* Party Chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Party Chat
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                {partyMessages.length === 0 && (
                    <div className="text-xs text-slate-600 text-center italic mt-10">
                        <div className="text-2xl mb-2 opacity-20">💬</div>
                        No party chatter yet...
                    </div>
                )}
                {partyMessages.map(pm => (
                    <div key={pm.id} className="text-xs bg-slate-800/30 p-2 rounded-lg border border-slate-800">
                        <span className="font-bold text-indigo-400 block mb-1">{pm.character.name}</span>
                        <span className="text-slate-300 leading-relaxed">{pm.content}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendPartyMessage} className="p-3 border-t border-slate-800 bg-slate-900 relative z-10">
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-200 placeholder-slate-600 transition-all"
                    placeholder="Whisper to party..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                />
            </form>
        </div>
      </div>
    </div>
  )
}
