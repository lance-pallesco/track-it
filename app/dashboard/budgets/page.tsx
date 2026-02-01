import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BudgetsPageClient } from "./budgets-client"

export default async function BudgetsPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">
          Set spending limits and track your budget
        </p>
      </div>
      <BudgetsPageClient currency={session.user.currency ?? "PHP"} />
    </div>
  )
}
