import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center p-8 bg-card rounded-xl shadow-lg border border-muted">
        <div>
          <h1 className="text-4xl font-bold text-foreground">AI RPG Game</h1>
          <p className="mt-2 text-muted-foreground">Multiplayer RPG with AI Dungeon Master</p>
        </div>
        <div className="space-y-4">
          <Link href="/auth/signin" className="block w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:brightness-90 transition-all">
            Sign In
          </Link>
          <Link href="/auth/signup" className="block w-full bg-muted text-muted-foreground py-2 px-4 rounded-md hover:brightness-90 transition-all border border-muted">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
