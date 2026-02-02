import { z } from "zod"

const goalStatusEnum = z.enum(["ACTIVE", "PAUSED", "COMPLETED"])

export const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Target must be positive"),
  currentAmount: z.number().min(0).default(0),
  currency: z.string().length(3).default("PHP"),
  deadline: z.coerce.date().optional().nullable(),
  linkedAccountId: z.string().uuid().optional().nullable(),
})

export const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.coerce.date().optional().nullable(),
  linkedAccountId: z.string().uuid().optional().nullable(),
  status: goalStatusEnum.optional(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
