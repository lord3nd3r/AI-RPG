import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardClient from './Client'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
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

        <div className="mb-8">
          {/* Client-managed dashboard */}
          <DashboardClient />
        </div>
      </div>
    </div>
  )
}
