import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const ROOT_EMAIL = process.env.ROOT_ADMIN_EMAIL
  const isRoot = ROOT_EMAIL && session?.user?.email === ROOT_EMAIL
  const isAdmin = session?.user?.role === 'admin' || isRoot

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-900 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Admin Console
          </h1>
          <Link href="/admin/users" className="hover:text-white text-slate-400 text-sm">Users</Link>
          <Link href="/admin/items" className="hover:text-white text-slate-400 text-sm">Items</Link>
          <Link href="/dashboard" className="ml-auto hover:text-white text-slate-400 text-sm">Exit</Link>
        </div>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
