import { z } from "zod"

const transactionTypeEnum = z.enum(["INCOME", "EXPENSE", "TRANSFER"])

export const createTransactionSchema = z
  .object({
    accountId: z.string().uuid(),
    toAccountId: z.string().uuid().optional(),
    amount: z.number().positive("Amount must be positive"),
    type: transactionTypeEnum,
    categoryId: z.string().uuid().optional().nullable(),
    note: z.string().max(500).optional().nullable(),
    date: z.coerce.date(),
    receiptMetadata: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "TRANSFER") return !!data.toAccountId && data.toAccountId !== data.accountId
      return true
    },
    { message: "Transfer must have a different destination account", path: ["toAccountId"] }
  )

export const updateTransactionSchema = createTransactionSchema.partial()

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeEnum.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>
