'use client'

import { useState } from 'react'
import InventoryPanel from './InventoryPanel'
import { Box } from 'lucide-react'

export default function InventoryButton({ gameId, characterId }: { gameId: string, characterId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md text-sm">
        <Box className="w-4 h-4" />
        Inventory
      </button>
      {open && <InventoryPanel gameId={gameId} characterId={characterId} onClose={() => setOpen(false)} />}
    </>
  )
}
