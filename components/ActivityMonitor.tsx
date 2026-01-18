'use client'

import { useEffect, useState } from 'react'

type OnlineUser = {
  id: string
  name: string
}

type ActivityStats = {
  onlineUsers: OnlineUser[]
  visitorCount: number
}

export function ActivityMonitor() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; userId: string } | null>(null)

  useEffect(() => {
    // Close menu on click anywhere
    const handleClick = () => setMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    // 1. Get or create Visitor ID
    let visitorId = localStorage.getItem('ai_rpg_visitor_id')
    if (!visitorId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        visitorId = crypto.randomUUID();
      } else {
        // Simple fallback/polyfill for insecure contexts or older browsers
        visitorId = 'v-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
      localStorage.setItem('ai_rpg_visitor_id', visitorId!)
    }

    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/system/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId }),
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Activity polling failed', err)
      }
    }

    // Initial fetch
    fetchActivity()

    // Poll every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, userId: string) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, userId })
  }

  const handleAddFriend = async (userId: string) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        alert('Friend request sent!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to send friend request')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred')
    }
    setMenu(null)
  }

  if (!stats) return null

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm relative">
      {menu && (
        <div 
          className="fixed z-50 bg-slate-800 border border-slate-700 rounded shadow-xl py-1 min-w-[120px]"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => handleAddFriend(menu.userId)}
            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Add Friend
          </button>
        </div>
      )}
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
          <span>🌐</span> Live Activity
        </h3>
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <span>👥</span> Browsing
            </span>
            <span className="font-bold">{stats.visitorCount}</span>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block mb-2">Logged In Accounts</span>
            {stats.onlineUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">None active recently</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.onlineUsers.map(u => (
                  <div 
                    key={u.id} 
                    className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded text-xs cursor-context-menu hover:bg-secondary transition-colors"
                    onContextMenu={(e) => handleContextMenu(e, u.id)}
                  >
                    <span>👤</span>
                    <span className="truncate max-w-[100px]" title={u.name}>{u.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
