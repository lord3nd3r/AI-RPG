'use client'

import { useEffect, useState } from 'react'
import { X, Eye, Zap, Trash2 } from 'lucide-react'

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
    const res = await fetch(`/api/inventory?gameId=${gameId}&characterId=${characterId}`)
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }

  async function doAction(action: string) {
    if (!selected) return
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, characterId, action, itemId: selected })
    })
    const data = await res.json()
    if (action === 'examine' && data.item) setExamine(data.item)
    else await fetchItems()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Inventory</h3>
          <button onClick={onClose} className="text-muted-foreground"><X /></button>
        </div>

        {loading ? <div>Loading...</div> : (
          <div className="space-y-3">
            {items.length === 0 && <div className="text-sm text-muted-foreground">No items</div>}
            {items.map(i => (
              <div key={i.id} className={`p-2 rounded-md border border-border flex items-center justify-between cursor-pointer ${selected === i.item.id ? 'bg-primary/5' : ''}`} onClick={() => setSelected(i.item.id)}>
                <div>
                  <div className="font-medium">{i.item.name} {i.equipped ? <span className="text-xs text-primary ml-2">(Equipped)</span> : null}</div>
                  <div className="text-xs text-muted-foreground">x{i.quantity} • {i.item.rarity || 'Common'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setSelected(i.item.id); doAction('examine') }} title="Examine" className="p-2 rounded hover:bg-muted/5"><Eye className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setSelected(i.item.id); doAction('use') }} title="Use" className="p-2 rounded hover:bg-muted/5"><Zap className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setSelected(i.item.id); doAction('drop') }} title="Drop" className="p-2 rounded hover:bg-muted/5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}

            {examine && (
              <div className="mt-2 p-3 rounded border border-border bg-background">
                <div className="font-semibold">{examine.name}</div>
                <div className="text-sm text-muted-foreground">{examine.description}</div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
