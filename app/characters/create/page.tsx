'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateCharacter() {
  const [name, setName] = useState('')
  const [characterClass, setCharacterClass] = useState('Warrior')
  const [stats, setStats] = useState({
    strength: 10,
    intelligence: 10,
    dexterity: 10,
    constitution: 10,
    wisdom: 10,
    charisma: 10,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, class: characterClass, stats }),
    })
    if (response.ok) {
      router.push('/dashboard')
    } else {
      alert('Error creating character')
    }
  }

  const updateStat = (stat: string, value: number) => {
    setStats({ ...stats, [stat]: value })
  }

  return (
    <div className="min-h-screen py-12 flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-xl w-full mx-auto bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 relative z-10">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-4 transform rotate-3">
                👤
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Forge Your Hero</h1>
            <p className="text-slate-400 mt-2">Define your avatar's destiny in the realms.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Character Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
              placeholder="e.g. Aragorn, Gandalf..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Class Preference</label>
            <div className="relative">
                <select
                value={characterClass}
                onChange={(e) => setCharacterClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer shadow-inner"
                >
                {['Warrior', 'Mage', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Bard', 'Druid', 'Necromancer', 'Monk'].map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
            </div>
          </div>

          <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Ability Scores</h3>
             <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats).map(([stat, value]) => (
                    <div key={stat} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300 capitalize">{stat}</label>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => updateStat(stat, parseInt(e.target.value))}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-md text-center text-white py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                            min="1"
                            max="20"
                        />
                    </div>
                ))}
             </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Awaken Character
          </button>
        </form>
      </div>
    </div>
  )
}