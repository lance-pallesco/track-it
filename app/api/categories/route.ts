import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getCategoriesByUserId, createCategory, ensureDefaultCategories } from "@/lib/services/category.service"
import { createCategorySchema } from "@/lib/validations/category"

export async function GET(request: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await ensureDefaultCategories(session.user.id)
  const url = new URL(request.url)
  const type = url.searchParams.get("type") as "INCOME" | "EXPENSE" | null
  const includeArchived = url.searchParams.get("includeArchived") !== "false"
  const categories = await getCategoriesByUserId(session.user.id, {
    type: type ?? undefined,
    includeArchived,
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const category = await createCategory({
      userId: session.user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      parentId: parsed.data.parentId,
    })
    return NextResponse.json(category, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create" }, { status: 500 })
  }
}
