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

  if (!stats) return null

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
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
                  <div key={u.id} className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded text-xs">
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
