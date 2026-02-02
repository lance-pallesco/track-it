import { z } from "zod"

const categoryTypeEnum = z.enum(["INCOME", "EXPENSE"])

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  type: categoryTypeEnum,
  icon: z.string().max(50).optional(),
  parentId: z.string().uuid().optional().nullable(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().max(50).optional(),
  isArchived: z.boolean().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
