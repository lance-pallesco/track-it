import { z } from "zod"

const accountTypeEnum = z.enum([
  "CASH",
  "BANK",
  "E_WALLET",
  "CREDIT_CARD",
  "LOAN",
  "INVESTMENT",
])

export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: accountTypeEnum,
  initialAmount: z.number().finite(),
  currency: z.string().length(3).default("PHP"),
  color: z.string().max(20).optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
