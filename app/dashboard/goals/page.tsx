import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GoalsPageClient } from "./goals-client"

export default async function GoalsPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goals & Savings</h1>
        <p className="text-muted-foreground">
          Track your savings goals and milestones
        </p>
      </div>
      <GoalsPageClient currency={session.user.currency ?? "PHP"} />
    </div>
  )
}
