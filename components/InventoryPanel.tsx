'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function InventoryPanel({ gameId, characterId, onClose }: { gameId: string, characterId: string, onClose: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [examine, setExamine] = useState<any | null>(null)

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory?gameId=${gameId}&characterId=${characterId}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to load inventory', data)
        setItems([])
      } else {
        setItems(data.items || [])
      }
    } catch (err) {
      console.error('Inventory fetch error', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function doAction(action: string) {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, characterId, action, itemId: selected })
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Inventory action failed', data)
      } else {
        if (action === 'examine' && data.item) setExamine(data.item)
        else await fetchItems()
      }
    } catch (err) {
      console.error('Inventory action error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Inventory</h3>
          <button onClick={onClose} className="text-muted-foreground"><X /></button>
        </div>

        {loading ? (
          <div className="text-center text-sm">Loading...</div>
        ) : (
          <>
            {items.length === 0 && <div className="text-sm text-muted-foreground">No items</div>}

            {/* SNES-style grid */}
            <div className="grid grid-cols-4 gap-2">
              {items.map((i) => {
                // determine emoji/icon
                const name: string = i.item?.name || 'Item'
                const rarity: string = i.item?.rarity || 'common'
                const emojiMap: Record<string, string> = {
                  'potion': '🧪', 'elixir': '🧪', 'sword': '🗡️', 'shield': '🛡️', 'scroll': '📜', 'ring': '💍', 'bow': '🏹', 'apple': '🍎', 'gem': '💎'
                }
                const lower = name.toLowerCase()
                let icon = '🎒'
                for (const k of Object.keys(emojiMap)) if (lower.includes(k)) { icon = emojiMap[k]; break }
                if (rarity === 'rare') icon = '✨' + icon

                const isSelected = selected === i.item.id

                return (
                  <div key={i.id} onClick={() => setSelected(i.item.id)} className={`relative group cursor-pointer select-none rounded-sm border-2 ${isSelected ? 'border-amber-400' : 'border-slate-700'} bg-gradient-to-b from-slate-800 to-slate-900 p-2 flex flex-col items-center justify-between`}>
                    <div className="w-full flex justify-between items-start">
                      {i.equipped && <div className="text-xs bg-amber-800 text-amber-100 px-1 rounded">E</div>}
                      <div className="text-xs text-slate-400">{i.item?.rarity ? i.item.rarity.charAt(0).toUpperCase() : ''}</div>
                    </div>
                    <div className="text-3xl leading-none my-1">{icon}</div>
                    <div className="text-[11px] font-mono text-center mt-1">{i.item?.name}</div>
                    <div className="absolute -bottom-2 right-2 bg-black text-white text-[10px] px-1 rounded border border-white/10">x{i.quantity}</div>
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelected(i.item.id); doAction('examine') }} className="bg-[#cbd5e1] text-black px-2 py-1 text-xs rounded-sm border-2 border-black shadow-[2px_2px_0_black]">Look</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelected(i.item.id); doAction('use') }} className="bg-[#a7f3d0] text-black px-2 py-1 text-xs rounded-sm border-2 border-black shadow-[2px_2px_0_black]">Use</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelected(i.item.id); doAction('drop') }} className="bg-[#fecaca] text-black px-2 py-1 text-xs rounded-sm border-2 border-black shadow-[2px_2px_0_black]">Drop</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {examine && (
              <div className="mt-2 p-3 rounded border border-border bg-background">
                <div className="font-semibold">{examine.name}</div>
                <div className="text-sm text-muted-foreground">{examine.description}</div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
