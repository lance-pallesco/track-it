"use client"

import { useEffect, useState } from "react"
import { Plus, Target } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

type Goal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  currency: string
  status: string
  deadline: string | null
  linkedAccount?: { name: string } | null
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount)
}

export function GoalsPageClient({ currency }: { currency: string }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [accounts, setAccounts] = useState<SelectOption[]>([])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get<Goal[]>("/api/goals")
      setGoals(data)
    } catch {
      toast.error("Failed to load goals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  useEffect(() => {
    axios.get("/api/accounts").then(({ data }) =>
      setAccounts(data.filter((a: { status: string }) => a.status === "ACTIVE").map((a: { id: string; name: string }) => ({ value: a.id, label: a.name })))
    )
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Savings goals and progress</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Add goal</Button>
            </DialogTrigger>
            <DialogContent>
              <AddGoalDialog
                currency={currency}
                accounts={accounts}
                onSuccess={() => { setDialogOpen(false); fetchGoals() }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : goals.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No goals yet. Add one to start saving.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0
                const isComplete = g.status === "COMPLETED"
                return (
                  <Card key={g.id} className={cn(isComplete && "border-green-500/50 bg-green-500/5")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">{g.name}</CardTitle>
                      <Badge variant={isComplete ? "success" : g.status === "PAUSED" ? "secondary" : "default"}>
                        {g.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatAmount(g.currentAmount, g.currency)} / {formatAmount(g.targetAmount, g.currency)}
                      </p>
                      <Progress value={pct} max={100} className="mt-2" />
                      {g.linkedAccount && (
                        <p className="text-xs text-muted-foreground mt-1">Linked: {g.linkedAccount.name}</p>
                      )}
                      {g.deadline && (
                        <p className="text-xs text-muted-foreground">By {new Date(g.deadline).toLocaleDateString()}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function AddGoalDialog({
  currency,
  accounts,
  onSuccess,
  onCancel,
}: {
  currency: string
  accounts: SelectOption[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("0")
  const [linkedAccountId, setLinkedAccountId] = useState("")
  const [deadline, setDeadline] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const target = parseFloat(targetAmount)
    const current = parseFloat(currentAmount)
    if (Number.isNaN(target) || target <= 0) {
      setError("Target must be positive")
      return
    }
    if (Number.isNaN(current) || current < 0) {
      setError("Current amount must be non-negative")
      return
    }
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    setLoading(true)
    try {
      await axios.post("/api/goals", {
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        currency,
        linkedAccountId: linkedAccountId || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      })
      toast.success("Goal created")
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError("Failed to create goal")
      }
      toast.error("Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add goal</DialogTitle>
        <DialogDescription>Set a savings target</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" required />
        </div>
        <div className="space-y-2">
          <Label>Target amount ({currency})</Label>
          <Input type="number" step="any" min="0" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Current amount (optional)</Label>
          <Input type="number" step="any" min="0" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Linked account (optional)</Label>
          <Select options={[{ value: "", label: "None" }, ...accounts]} value={linkedAccountId} onValueChange={setLinkedAccountId} placeholder="None" />
        </div>
        <div className="space-y-2">
          <Label>Deadline (optional)</Label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create"}</Button>
        </DialogFooter>
      </form>
    </>
  )
}
