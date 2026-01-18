import { getSession } from '@/lib/auth'
import MessengerClient from './Client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function MessagesPage() {
  const session = await getSession()

  if (!session || !session.user?.id) {
    return <div>Please sign in</div>
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 backdrop-blur shrink-0">
        <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <MessengerClient userId={session.user.id} />
      </div>
    </div>
  )
}
