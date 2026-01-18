import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getSession()
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)] animate-pulse" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="max-w-4xl w-full space-y-12 text-center p-8 relative z-10">
        <div className="space-y-6">
          <div className="inline-block relative">
             <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
             <h1 className="relative text-7xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent pb-2">
               AETHER RPG
             </h1>
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Forge your destiny in a living, breathing world masterminded by 
            <span className="text-indigo-400 font-semibold"> Artificial Intelligence</span>. 
            Gather your party, roll the dice, and transcend reality.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Link href="/auth/signin" className="group relative w-full sm:w-auto px-8 py-4 rounded-lg bg-indigo-600 text-white font-bold text-lg overflow-hidden transition-all hover:bg-indigo-700 hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span>Enter the Realm</span>
          </Link>
          
          <Link href="/auth/signup" className="group w-full sm:w-auto px-8 py-4 rounded-lg bg-slate-900/50 backdrop-blur-md border border-slate-700 text-slate-300 font-bold text-lg transition-all hover:bg-slate-800 hover:text-white hover:border-slate-600">
            <span>Create Account</span>
          </Link>
        </div>
      </div>
      
      {/* Footer / Deco */}
      <div className="absolute bottom-8 text-slate-600 text-sm">
        Powered by Next.js & AI
      </div>
    </div>
  )
}
