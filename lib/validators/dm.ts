import { z } from 'zod'

export const DMUpdateSchema = z.object({
  updates: z.array(z.object({
    characterName: z.string(),
    hpChange: z.number().optional(),
    statusEffect: z.string().optional(),
    action: z.enum(['add', 'remove']).optional(),
  })),
})

export type DMUpdate = z.infer<typeof DMUpdateSchema>
