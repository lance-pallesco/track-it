import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TransactionsPageClient } from "./transactions-client"

export default async function TransactionsPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          View and manage your income, expenses, and transfers
        </p>
      </div>
      <TransactionsPageClient currency={session.user.currency ?? "PHP"} />
    </div>
  )
}
