import { getSession } from '@/lib/auth'
import Link from 'next/link'
import DashboardClient from './Client' 
import FriendsList from '@/components/FriendsList'

export default async function Dashboard() {
  const session = await getSession()

  if (!session || !session.user?.id) {
    // ...
    return <div>Please sign in</div>
  }

  // Render a client dashboard component that will fetch and manage editable data.
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight underline decoration-primary decoration-4 underline-offset-4">Dashboard</h1>
          <div className="hidden sm:block text-sm text-muted-foreground italic">
            "Your legend begins here..."
          </div>
        </div>
        
        <div className="mb-12 relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
           <Link href="/lobby" className="relative block w-full text-center bg-card hover:bg-card/90 text-foreground text-2xl font-black py-8 rounded-lg transition border border-border shadow-2xl flex items-center justify-center gap-4 uppercase tracking-widest">
             <span className="text-4xl">⚔️</span> 
             <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Enter Multiplayer Lobby</span>
             <span className="text-4xl">🛡️</span>
           </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <DashboardClient />
          </div>
          <div className="xl:col-span-1">
            <FriendsList />
          </div>
        </div>
      </div>
    </div>
  )
}
