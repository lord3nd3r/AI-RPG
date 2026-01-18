import { z } from 'zod'

export const DMUpdateSchema = z.object({
  updates: z.array(z.object({
    characterName: z.string(),
    hpChange: z.number().optional(),
    mpChange: z.number().optional(),
    xpChange: z.number().optional(),
    statusEffect: z.string().optional(),
    action: z.enum(['add', 'remove']).optional(),
  })),
  loot: z.array(z.object({
    characterName: z.string(),
    itemName: z.string(),
    quantity: z.number().optional().default(1),
    description: z.string().optional()
  })).optional()
})

export type DMUpdate = z.infer<typeof DMUpdateSchema>
