'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  createdAt: string
  lastSeen: string
  _count: {
    characters: number
    games: number
  }
  isRoot: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserIsRoot, setCurrentUserIsRoot] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setCurrentUserIsRoot(data.isRoot)
      } else {
        setMsg('Failed to load users')
      }
    } catch {
      setMsg('Error fetching users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })

      if (res.ok) {
        fetchUsers() // Refresh list
        setMsg(`Action ${action} successful`)
        setTimeout(() => setMsg(''), 3000)
      } else {
        const d = await res.json()
        alert(d.error || 'Action failed')
      }
    } catch {
      alert('Network error')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading users...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      {msg && <div className="mb-4 p-2 bg-blue-900/50 text-blue-200 rounded">{msg}</div>}
      
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left bg-slate-900/50">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3">Stats</th>
              <th className="p-3">Last Seen</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {users.map(u => (
              <tr key={u.id} className={`hover:bg-slate-800/50 ${u.banned ? 'opacity-50 bg-red-900/10' : ''}`}>
                <td className="p-3">
                   <div className="font-bold text-white">{u.name || 'No Name'}</div>
                   <div className="text-slate-500 text-xs font-mono">{u.email}</div>
                   {u.isRoot && <span className="inline-block mt-1 px-1.5 py-0.5 bg-purple-900/50 text-purple-300 text-[10px] rounded border border-purple-800">ROOT ADMIN</span>}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${
                    u.role === 'admin' 
                      ? 'bg-orange-900/30 text-orange-400 border-orange-800' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {u.role}
                  </span>
                  {u.banned && <span className="ml-2 px-2 py-1 bg-red-900/50 text-red-400 border border-red-800 rounded text-xs">BANNED</span>}
                </td>
                <td className="p-3 text-slate-400">
                  <div>Chars: <span className="text-white">{u._count.characters}</span></div>
                  <div>Games: <span className="text-white">{u._count.games}</span></div>
                </td>
                <td className="p-3 text-slate-500">
                   {new Date(u.lastSeen).toLocaleDateString()}
                </td>
                <td className="p-3 text-right space-x-2">
                  {!u.isRoot && (
                    <>
                      {/* Only Root can promote/demote */}
                      {currentUserIsRoot && (
                        <button
                          onClick={() => handleAction(u.id, u.role === 'admin' ? 'demote' : 'promote')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-white border border-slate-600"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </button>
                      )}
                      
                      {/* Non-banned can be banned, Banned can be unbanned. 
                          Only Root can ban Admins (handled by API, but UI can hint).
                          If target is Admin and current is NOT Root, disable or hide? 
                          API blocks it, but let's hide to be nice.
                      */}
                      {(!u.banned) ? (
                        <button 
                          onClick={() => handleAction(u.id, 'ban')}
                          disabled={u.role === 'admin' && !currentUserIsRoot}
                          className={`px-2 py-1 rounded text-xs text-white border ${
                             u.role === 'admin' && !currentUserIsRoot
                             ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                             : 'bg-red-900/30 hover:bg-red-900/50 border-red-800 text-red-200'
                          }`}
                        >
                          Ban
                        </button>
                      ) : (
                        <button 
                           onClick={() => handleAction(u.id, 'unban')}
                           className="px-2 py-1 bg-green-900/30 hover:bg-green-900/50 border-green-800 text-green-200 rounded text-xs"
                        >
                          Unban
                        </button>
                      )}
                    </>
                  )}
                  {u.isRoot && <span className="text-purple-500 text-xs italic">Protected</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
