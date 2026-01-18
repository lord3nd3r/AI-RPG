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
    <div className="min-h-screen py-8">
      <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow border border-muted">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Create Character</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-muted rounded-md shadow-sm bg-background text-foreground px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground">Class</label>
            <select
              value={characterClass}
              onChange={(e) => setCharacterClass(e.target.value)}
              className="mt-1 block w-full border border-muted rounded-md shadow-sm bg-background text-foreground px-3 py-2"
            >
              <option value="Warrior">Warrior</option>
              <option value="Mage">Mage</option>
              <option value="Rogue">Rogue</option>
              <option value="Cleric">Cleric</option>
              <option value="Paladin">Paladin</option>
              <option value="Ranger">Ranger</option>
              <option value="Bard">Bard</option>
              <option value="Druid">Druid</option>
            </select>
          </div>

          {Object.entries(stats).map(([stat, value]) => (
            <div key={stat}>
              <label className="block text-sm font-medium text-foreground capitalize">{stat}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => updateStat(stat, parseInt(e.target.value))}
                className="mt-1 block w-full border border-muted rounded-md shadow-sm bg-background text-foreground px-3 py-2"
                min="1"
                max="20"
              />
            </div>
          ))}
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:brightness-90 transition-all font-medium"
          >
            Create Character
          </button>
        </form>
      </div>
    </div>
  )
}