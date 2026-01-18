import AdminItemForm from '@/components/AdminItemForm'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminItemsPage() {
  const session = await getSession()
  if (!session) redirect('/auth/signin?callbackUrl=/admin/items')

  const items = await prisma.item.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Item Manager (DM)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <AdminItemForm />
        </div>

        <div>
           <h2 className="text-xl mb-4">Recent Items</h2>
           <div className="space-y-2">
             {items.map(item => (
               <div key={item.id} className="p-3 border border-slate-700 rounded bg-slate-900 flex justify-between items-start">
                 <div>
                   <div className="font-bold text-lg">{item.name}</div>
                   <div className="text-sm text-gray-400">{item.description}</div>
                   <div className="text-xs text-yellow-500">{item.rarity}</div>
                 </div>
                 <div className="text-xs font-mono text-gray-500 max-w-[150px] overflow-hidden truncate">
                   {item.meta}
                 </div>
               </div>
             ))}
             {items.length === 0 && <p className="text-gray-500">No items found.</p>}
           </div>
        </div>
      </div>
    </div>
  )
}
