"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

type BudgetWithUtil = {
  id: string
  amount: number
  spent: number
  utilization: number
  isOver: boolean
  category: { name: string }
  month: string
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount)
}

export function BudgetsPageClient({ currency }: { currency: string }) {
  const [budgets, setBudgets] = useState<BudgetWithUtil[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get<BudgetWithUtil[]>("/api/budgets?month=" + month)
      setBudgets(data)
    } catch {
      toast.error("Failed to load budgets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [month])

  useEffect(() => {
    axios.get("/api/categories?type=EXPENSE&includeArchived=false").then(({ data }) =>
      setCategories(data.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
    )
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Monthly spending limits by category</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-40"
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="size-4" /> Add budget</Button>
              </DialogTrigger>
              <DialogContent>
                <AddBudgetDialog
                  currency={currency}
                  categories={categories}
                  month={month}
                  onSuccess={() => { setDialogOpen(false); fetchBudgets() }}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : budgets.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No budgets for this month. Add one to get started.</p>
          ) : (
            <div className="space-y-6">
              {budgets.some((b) => b.isOver) && (
                <Alert variant="destructive">
                  <AlertTitle>Overspending</AlertTitle>
                  <AlertDescription>Some categories are over budget this month.</AlertDescription>
                </Alert>
              )}
              {budgets.map((b) => (
                <div key={b.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatAmount(b.spent, currency)} / {formatAmount(b.amount, currency)}
                    </span>
                  </div>
                  <Progress value={Math.min(b.utilization * 100, 100)} max={100} className={cn(b.isOver && "bg-destructive/20")} />
                  {b.isOver && (
                    <p className="text-sm text-destructive">Over by {formatAmount(b.spent - b.amount, currency)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function AddBudgetDialog({
  currency,
  categories,
  month,
  onSuccess,
  onCancel,
}: {
  currency: string
  categories: SelectOption[]
  month: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
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
    if (!categoryId) {
      setError("Select a category")
      return
    }
    setLoading(true)
    try {
      await axios.post("/api/budgets", { categoryId, amount: amt, month })
      toast.success("Budget created")
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError("Failed to create budget")
      }
      toast.error("Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add budget</DialogTitle>
        <DialogDescription>Set a monthly limit for a category</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select options={categories} value={categoryId} onValueChange={setCategoryId} placeholder="Select category" />
        </div>
        <div className="space-y-2">
          <Label>Amount ({currency})</Label>
          <Input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <p className="text-sm text-muted-foreground">Month: {month}</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create"}</Button>
        </DialogFooter>
      </form>
    </>
  )
}
