'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminItemForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rarity, setRarity] = useState('Common')
  const [meta, setMeta] = useState('{"hpRestore": 10}')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let parsedMeta = null
      if (meta) {
        try {
          parsedMeta = JSON.parse(meta)
        } catch (err) {
          setMessage('Invalid JSON in meta field')
          return
        }
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, rarity, meta: parsedMeta })
      })

      if (res.ok) {
        setMessage('Item created!')
        setName('')
        setDescription('')
        setMeta('{"hpRestore": 10}')
        router.refresh()
      } else {
        setMessage('Error creating item')
      }
    } catch (error) {
      setMessage('Something went wrong')
    }
  }

  return (
    <div className="p-4 border rounded bg-slate-800 text-white">
      <h2 className="text-xl mb-4">Create New Item</h2>
      {message && <div className="p-2 mb-2 bg-blue-600 rounded">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Item Name</label>
          <input 
            className="w-full p-2 rounded bg-slate-700"
            value={name} onChange={e => setName(e.target.value)} required 
          />
        </div>
        <div>
          <label className="block text-sm">Description</label>
          <input 
            className="w-full p-2 rounded bg-slate-700"
            value={description} onChange={e => setDescription(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm">Rarity</label>
          <select 
            className="w-full p-2 rounded bg-slate-700"
            value={rarity} onChange={e => setRarity(e.target.value)}
          >
            <option>Common</option>
            <option>Uncommon</option>
            <option>Rare</option>
            <option>Epic</option>
            <option>Legendary</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Meta (JSON Effects)</label>
          <textarea 
            className="w-full p-2 rounded bg-slate-700 font-mono text-xs"
            rows={4}
            value={meta} onChange={e => setMeta(e.target.value)}
          />
          <p className="text-xs text-gray-400">e.g. {`{"hpRestore": 50}`} or {`{"statusEffect": "Poisoned"}`}</p>
        </div>
        <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">
          Create Item
        </button>
      </form>
    </div>
  )
}
