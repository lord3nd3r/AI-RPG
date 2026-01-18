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
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>
        
        <div className="mb-8">
           <Link href="/lobby" className="block w-full text-center bg-accent text-accent-foreground text-xl font-bold py-4 rounded-lg hover:bg-accent/90 transition shadow-lg border border-accent">
             ⚔️ Enter Multiplayer Lobby 🛡️
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DashboardClient />
          </div>
          <div>
            <FriendsList />
          </div>
        </div>
      </div>
    </div>
  )
}
