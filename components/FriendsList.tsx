'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Friend {
  id: string
  name: string | null
  email: string
  friendshipId: string
}

export default function FriendsList() {
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
  const [sent, setSent] = useState<Friend[]>([])
  const [received, setReceived] = useState<Friend[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends')
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends)
        setSent(data.sent)
        setReceived(data.received)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to send request')
      
      setSuccess('Friend request sent!')
      setEmail('')
      fetchFriends()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  const handleAction = async (friendshipId: string, action: 'accept' | 'reject' | 'delete') => {
    try {
      if (action === 'delete' || action === 'reject') {
        await fetch('/api/friends', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendshipId })
        })
      } else {
        await fetch('/api/friends', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendshipId, action })
        })
      }
      fetchFriends()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMessage = (friendId: string) => {
    router.push(`/messages?userId=${friendId}`)
  }

  if (loading) return <div className="text-slate-400">Loading allies...</div>

  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
       {/* Ambient glow effects */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-all duration-700"></div>

      <h2 className="text-2xl font-bold mb-6 font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 flex items-center gap-3 drop-shadow-sm">
        <span className="text-2xl filter drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">✨</span> Allies & Rivals
      </h2>

      <form onSubmit={addFriend} className="mb-8 relative z-10">
        <div className="flex gap-2">
          <div className="relative flex-1 group/input">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-indigo-400 group-focus-within/input:text-indigo-300 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Summon ally by email..." 
              className="w-full bg-slate-950/50 border border-indigo-500/30 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all shadow-inner"
              required
            />
          </div>
          <button 
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl transition-all font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95 border border-white/10"
          >
            Invoke
          </button>
        </div>
        {error && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-300 text-sm animate-pulse">
                <span>⚠️</span> {error}
            </div>
        )}
        {success && (
            <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-300 text-sm">
                <span>✨</span> {success}
            </div>
        )}
      </form>

      <div className="space-y-8 relative z-10">
        {received.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-1 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <div className="bg-slate-900/60 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    Incoming Summons
                </h3>
                <div className="space-y-3">
                {received.map(friend => (
                    <div key={friend.friendshipId} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group/item">
                        <div className="flex items-center gap-3 mb-3 sm:mb-0">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {friend.name?.[0]?.toUpperCase() || friend.email[0].toUpperCase()}
                            </div>
                            <div>
                                <span className="text-slate-100 block font-bold text-sm">{friend.name || 'Mysterious Wanderer'}</span>
                                <span className="text-slate-400 text-xs">{friend.email}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                            onClick={() => handleAction(friend.friendshipId, 'accept')}
                            className="flex-1 sm:flex-none text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] font-semibold"
                            >
                            Accept
                            </button>
                            <button 
                            onClick={() => handleAction(friend.friendshipId, 'reject')}
                            className="flex-1 sm:flex-none text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg border border-red-500/30 transition-all hover:bg-red-500/40 font-semibold"
                            >
                            Reject
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            </div>
          </div>
        )}

        {sent.length > 0 && (
          <div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 ml-1">Pending Requests</h3>
            <ul className="space-y-2">
              {sent.map(friend => (
                <li key={friend.friendshipId} className="flex items-center justify-between bg-slate-800/20 border border-dashed border-slate-700/50 p-3 rounded-xl px-4 hover:bg-slate-800/40 transition-colors">
                   <div className="flex items-center gap-3 opacity-60">
                     <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                        ?
                     </div>
                    <div>
                        <span className="text-slate-300 block text-xs font-medium">{friend.name || friend.email}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-yellow-500 rounded-full animate-ping"></span>
                            Awaiting response...
                        </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAction(friend.friendshipId, 'delete')}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                    title="Cancel Request"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 ml-1 flex items-center justify-between">
            <span>Companions</span>
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">{friends.length}</span>
          </h3>
          {friends.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-900/30">
                <div className="text-4xl mb-3 opacity-20">🛡️</div>
                <p className="text-slate-500 text-sm">The road is lonely.</p>
                <p className="text-slate-600 text-xs mt-1">Summon an ally above to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                 <div key={friend.friendshipId} className="flex items-center justify-between group bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-600 shadow-inner group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all">
                        {friend.name?.[0]?.toUpperCase() || friend.email[0].toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                    </div>
                    <div>
                      <span className="text-slate-200 block font-bold text-sm group-hover:text-indigo-200 transition-colors">{friend.name || 'Loyal Companion'}</span>
                      <span className="text-slate-500 text-xs group-hover:text-slate-400">{friend.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button 
                        onClick={() => handleMessage(friend.id)}
                        className="text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-indigo-500/10 rounded-lg transform translate-x-2 group-hover:translate-x-0 mr-1"
                        title="Send Message"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <button 
                        onClick={() => handleAction(friend.friendshipId, 'delete')}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-500/10 rounded-lg transform translate-x-2 group-hover:translate-x-0"
                        title="Remove Friend"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
