import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AccountsPageClient } from "./accounts-client"

export default async function AccountsPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accounts</h1>
        <p className="text-muted-foreground">
          Manage your bank accounts, cash, e-wallets, and more
        </p>
      </div>
      <AccountsPageClient currency={session.user.currency ?? "PHP"} />
    </div>
  )
}
