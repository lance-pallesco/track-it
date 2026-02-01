import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AnalyticsPageClient } from "./analytics-client"

export default async function AnalyticsPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Insights and reports for your finances</p>
      </div>
      <AnalyticsPageClient currency={session.user.currency ?? "PHP"} />
    </div>
  )
}
