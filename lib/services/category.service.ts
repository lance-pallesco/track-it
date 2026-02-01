import { prisma } from "@/lib/prisma"
import type { TransactionType } from "@prisma/client"

export interface CreateCategoryInput {
  userId: string
  name: string
  type: TransactionType
  icon?: string
  parentId?: string | null
}

export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      userId: input.userId,
      name: input.name,
      type: input.type,
      icon: input.icon,
      parentId: input.parentId,
      isSystem: false,
    },
  })
}

export async function getCategoriesByUserId(
  userId: string,
  options?: { type?: TransactionType; includeArchived?: boolean }
) {
  const where: { userId: string; type?: TransactionType; isArchived?: boolean } = { userId }
  if (options?.type) where.type = options.type
  if (options?.includeArchived === false) where.isArchived = false
  return prisma.category.findMany({ where, orderBy: { name: "asc" } })
}

export async function getCategoryById(id: string, userId: string) {
  return prisma.category.findFirst({ where: { id, userId } })
}

export interface UpdateCategoryInput {
  name?: string
  icon?: string
  isArchived?: boolean
}

export async function updateCategory(id: string, userId: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findFirst({ where: { id, userId } })
  if (!existing) throw new Error("Category not found")
  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name != null && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
    },
  })
}

export async function ensureDefaultCategories(userId: string) {
  const existing = await prisma.category.findMany({
    where: { userId },
    select: { name: true, type: true },
  })
  const defaults: { name: string; type: "INCOME" | "EXPENSE" }[] = [
    { name: "Salary", type: "INCOME" },
    { name: "Other Income", type: "INCOME" },
    { name: "Food", type: "EXPENSE" },
    { name: "Transport", type: "EXPENSE" },
    { name: "Bills", type: "EXPENSE" },
    { name: "Shopping", type: "EXPENSE" },
    { name: "Other", type: "EXPENSE" },
  ]
  for (const d of defaults) {
    if (!existing.some((e) => e.name === d.name && e.type === d.type)) {
      await prisma.category.create({
        data: { userId, name: d.name, type: d.type, isSystem: true },
      })
    }
  }
}
