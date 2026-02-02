import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getCashFlow, getExpenseBreakdownByCategory, getMonthlySummary, getYearlySummary, getNetWorth } from "@/lib/services/analytics.service"

export async function GET(request: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const url = new URL(request.url)
  const tab = url.searchParams.get("tab") ?? "overview"
  const year = url.searchParams.get("year")
  const now = new Date()
  const currentYear = year ? parseInt(year, 10) : now.getFullYear()
  const from = new Date(currentYear, now.getMonth(), 1)
  const to = new Date()

  try {
    if (tab === "overview") {
      const [cashFlow, netWorth, breakdown] = await Promise.all([
        getCashFlow(session.user.id, { from, to }),
        getNetWorth(session.user.id),
        getExpenseBreakdownByCategory(session.user.id, { from, to }),
      ])
      return NextResponse.json({ cashFlow, netWorth, expenseBreakdown: breakdown })
    }
    if (tab === "monthly") {
      const monthly = await getMonthlySummary(session.user.id, currentYear)
      return NextResponse.json({ monthly })
    }
    if (tab === "yearly") {
      const yearly = await getYearlySummary(session.user.id, 5)
      return NextResponse.json({ yearly })
    }
    return NextResponse.json({ error: "Invalid tab" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
