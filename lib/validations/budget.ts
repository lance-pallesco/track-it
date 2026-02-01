import { z } from "zod"

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive("Budget amount must be positive"),
  month: z.string().min(7).max(7), // YYYY-MM
})

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
