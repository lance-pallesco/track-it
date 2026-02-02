"use client"

import { useEffect, useState } from "react"
import { Plus, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, type SelectOption } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Transaction = {
  id: string
  amount: number
  type: string
  date: string
  note: string | null
  account: { name: string }
  toAccount?: { name: string } | null
  category?: { name: string } | null
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
  { value: "TRANSFER", label: "Transfer" },
]

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount)
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d))
}

export function TransactionsPageClient({ currency }: { currency: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [accounts, setAccounts] = useState<{ id: string; name: string; status: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([])
  const [filterType, setFilterType] = useState<string>("")
  const [filterAccountId, setFilterAccountId] = useState<string>("")

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))
      if (filterType) params.set("type", filterType)
      if (filterAccountId) params.set("accountId", filterAccountId)
      const { data } = await axios.get<{ transactions: Transaction[]; total: number }>(
        "/api/transactions?" + params.toString()
      )
      setTransactions(data.transactions)
      setTotal(data.total)
    } catch {
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, filterType, filterAccountId])

  useEffect(() => {
    axios.get("/api/accounts").then(({ data }) => setAccounts(data.filter((a: { status: string }) => a.status === "ACTIVE")))
    axios.get("/api/categories?includeArchived=false").then(({ data }) => setCategories(data))
  }, [])

  const accountOptions: SelectOption[] = accounts.map((a) => ({ value: a.id, label: a.name }))
  const categoryOptions: SelectOption[] = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Income, expenses, and transfers</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Add transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <AddTransactionDialog
                currency={currency}
                accounts={accountOptions}
                categories={categories}
                onSuccess={() => { setDialogOpen(false); fetchTransactions() }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select
              options={[{ value: "", label: "All types" }, ...TYPE_OPTIONS]}
              value={filterType}
              onValueChange={setFilterType}
              placeholder="Type"
            />
            <Select
              options={[{ value: "", label: "All accounts" }, ...accountOptions]}
              value={filterAccountId}
              onValueChange={setFilterAccountId}
              placeholder="Account"
            />
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No transactions yet</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account / Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>
                        {t.type === "TRANSFER" ? (
                          <ArrowLeftRight className="size-4 inline text-muted-foreground" />
                        ) : t.type === "INCOME" ? (
                          <ArrowDownRight className="size-4 inline text-green-600" />
                        ) : (
                          <ArrowUpRight className="size-4 inline text-destructive" />
                        )}{" "}
                        {t.type}
                      </TableCell>
                      <TableCell>
                        {t.type === "TRANSFER" && t.toAccount
                          ? `${t.account.name} → ${t.toAccount.name}`
                          : t.category?.name ?? t.account.name}
                      </TableCell>
                      <TableCell className={cn("text-right font-medium", t.type === "INCOME" ? "text-green-600" : t.type === "EXPENSE" ? "text-destructive" : "text-muted-foreground")}>
                        {t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "-" : ""}
                        {formatAmount(t.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} · {total} total
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function AddTransactionDialog({
  currency,
  accounts,
  categories,
  onSuccess,
  onCancel,
}: {
  currency: string
  accounts: SelectOption[]
  categories: SelectOption[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [type, setType] = useState("EXPENSE")
  const [accountId, setAccountId] = useState("")
  const [toAccountId, setToAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be positive")
      return
    }
    if (!accountId) {
      setError("Select an account")
      return
    }
    if (type === "TRANSFER" && !toAccountId) {
      setError("Select destination account for transfer")
      return
    }
    setLoading(true)
    try {
      await axios.post("/api/transactions", {
        type,
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : undefined,
        categoryId: type !== "TRANSFER" && categoryId ? categoryId : undefined,
        amount: amt,
        date: new Date(date).toISOString(),
        note: note || undefined,
      })
      toast.success("Transaction added")
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError("Failed to add transaction")
      }
      toast.error("Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add transaction</DialogTitle>
        <DialogDescription>Income, expense, or transfer</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="space-y-2">
          <Label>Type</Label>
          <Select options={TYPE_OPTIONS} value={type} onValueChange={setType} />
        </div>
        <div className="space-y-2">
          <Label>{type === "TRANSFER" ? "From account" : "Account"}</Label>
          <Select options={accounts} value={accountId} onValueChange={setAccountId} placeholder="Select account" />
        </div>
        {type === "TRANSFER" && (
          <div className="space-y-2">
            <Label>To account</Label>
            <Select options={accounts.filter((a) => a.value !== accountId)} value={toAccountId} onValueChange={setToAccountId} placeholder="Select account" />
          </div>
        )}
        {type !== "TRANSFER" && (
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              options={categories.filter((c) => c.type === type).map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="Optional"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add"}</Button>
        </DialogFooter>
      </form>
    </>
  )
}
