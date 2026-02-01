"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Archive, Landmark, Wallet, CreditCard, Banknote, PiggyBank, TrendingUp } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, type SelectOption } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
  { value: "E_WALLET", label: "E-wallet" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "LOAN", label: "Loan" },
  { value: "INVESTMENT", label: "Investment" },
] satisfies SelectOption[]

type Account = {
  id: string
  name: string
  type: string
  status: string
  initialAmount: number | string
  currency: string
  color: string | null
  balance: number
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function AccountsPageClient({ currency }: { currency: string }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<Account | null>(null)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const fetchAccounts = async () => {
    try {
      const { data } = await axios.get<Account[]>("/api/accounts")
      setAccounts(data)
    } catch {
      toast.error("Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All accounts</CardTitle>
            <CardDescription>Balance, type, and status</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AccountFormDialog
                currency={currency}
                onSuccess={() => {
                  setCreateOpen(false)
                  fetchAccounts()
                }}
                onCancel={() => setCreateOpen(false)}
                setFormLoading={setFormLoading}
                formLoading={formLoading}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="mb-2">No accounts yet</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Add your first account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.name}</TableCell>
                    <TableCell>{ACCOUNT_TYPES.find((t) => t.value === acc.type)?.label ?? acc.type}</TableCell>
                    <TableCell className={cn(Number(acc.balance) >= 0 ? "" : "text-destructive")}>
                      {formatAmount(Number(acc.balance), acc.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={acc.status === "ACTIVE" ? "success" : "secondary"}>
                        {acc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {acc.status === "ACTIVE" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditAccount(acc)}
                            className="mr-1"
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setArchiveTarget(acc)}
                          >
                            <Archive className="size-4" />
                            <span className="sr-only">Archive</span>
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Archive confirmation */}
      <Dialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive account</DialogTitle>
            <DialogDescription>
              Archive &quot;{archiveTarget?.name}&quot;? Archived accounts cannot receive new
              transactions but remain visible for history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!archiveTarget) return
                try {
                  await axios.post(`/api/accounts/${archiveTarget.id}/archive`)
                  toast.success("Account archived")
                  setArchiveTarget(null)
                  fetchAccounts()
                } catch {
                  toast.error("Failed to archive")
                }
              }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editAccount} onOpenChange={(o) => !o && setEditAccount(null)}>
        <DialogContent>
          {editAccount && (
            <AccountFormDialog
              currency={currency}
              existing={editAccount}
              onSuccess={() => {
                setEditAccount(null)
                fetchAccounts()
              }}
              onCancel={() => setEditAccount(null)}
              setFormLoading={setFormLoading}
              formLoading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function AccountFormDialog({
  currency,
  existing,
  onSuccess,
  onCancel,
  setFormLoading,
  formLoading,
}: {
  currency: string
  existing?: Account
  onSuccess: () => void
  onCancel: () => void
  setFormLoading: (v: boolean) => void
  formLoading: boolean
}) {
  const [name, setName] = useState(existing?.name ?? "")
  const [type, setType] = useState(existing?.type ?? "BANK")
  const [initialAmount, setInitialAmount] = useState(
    existing != null ? String(Number(existing.initialAmount)) : "0"
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFormLoading(true)
    const amount = parseFloat(initialAmount)
    if (Number.isNaN(amount)) {
      setError("Invalid amount")
      setFormLoading(false)
      return
    }
    try {
      if (existing) {
        await axios.patch(`/api/accounts/${existing.id}`, {
          name: name.trim(),
          type,
          initialAmount: amount,
          currency,
        })
        toast.success("Account updated")
      } else {
        await axios.post("/api/accounts", {
          name: name.trim(),
          type,
          initialAmount: amount,
          currency,
        })
        toast.success("Account created")
      }
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError("Something went wrong")
      }
      toast.error("Failed to save")
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit account" : "Add account"}</DialogTitle>
        <DialogDescription>
          {existing ? "Update account details." : "Create a new financial account."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Bank"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            options={ACCOUNT_TYPES}
            value={type}
            onValueChange={setType}
            placeholder="Select type"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialAmount">Initial balance</Label>
          <Input
            id="initialAmount"
            type="number"
            step="any"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={formLoading}>
            {formLoading ? "Saving..." : existing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
