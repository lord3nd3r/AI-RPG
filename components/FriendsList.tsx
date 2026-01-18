'use client'

import { useState, useEffect } from 'react'

interface Friend {
  id: string
  name: string | null
  email: string
  friendshipId: string
}

export default function FriendsList() {
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

  if (loading) return <div className="text-slate-400">Loading allies...</div>

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-4 font-serif text-slate-100 flex items-center gap-2">
        <span>🛡️</span> Allies & Party Members
      </h2>

      <form onSubmit={addFriend} className="mb-6">
        <div className="flex gap-2">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter ally's email..." 
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            required
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-indigo-900/20"
          >
            Invite
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {success && <p className="text-emerald-400 text-sm mt-2">{success}</p>}
      </form>

      <div className="space-y-6">
        {received.length > 0 && (
          <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30">
            <h3 className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-3">Incoming Summons</h3>
            <div className="space-y-2">
              {received.map(friend => (
                <div key={friend.friendshipId} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-md">
                  <div>
                    <span className="text-slate-200 block font-medium">{friend.name || 'Unknown User'}</span>
                    <span className="text-slate-400 text-xs">{friend.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(friend.friendshipId, 'accept')}
                      className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-md border border-emerald-500/30 transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleAction(friend.friendshipId, 'reject')}
                      className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 px-3 py-1.5 rounded-md border border-red-500/30 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sent.length > 0 && (
          <div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Pending Requests</h3>
            <ul className="space-y-2">
              {sent.map(friend => (
                <li key={friend.friendshipId} className="flex items-center justify-between bg-slate-800/30 p-2 rounded px-3">
                   <div className="opacity-70">
                    <span className="text-slate-300 block text-sm">{friend.name || friend.email}</span>
                    <span className="text-slate-500 text-[10px]">Pending...</span>
                  </div>
                  <button 
                    onClick={() => handleAction(friend.friendshipId, 'delete')}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    title="Cancel Request"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">My Friends ({friends.length})</h3>
          {friends.length === 0 ? (
            <p className="text-slate-500 text-sm italic">You have no allies yet. Invite someone!</p>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                 <div key={friend.friendshipId} className="flex items-center justify-between group bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30">
                      {friend.name?.[0]?.toUpperCase() || friend.email[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-slate-200 block font-medium leading-none mb-1">{friend.name || 'Unknown Companion'}</span>
                      <span className="text-slate-500 text-xs">{friend.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAction(friend.friendshipId, 'delete')}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                    title="Remove Friend"
                  >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
