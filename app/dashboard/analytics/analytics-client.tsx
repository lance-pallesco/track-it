"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount)
}

export function AnalyticsPageClient({ currency }: { currency: string }) {
  const [tab, setTab] = useState("overview")
  const [overview, setOverview] = useState<{
    cashFlow: { income: number; expense: number; net: number }
    netWorth: number
    expenseBreakdown: { name: string; total: number }[]
  } | null>(null)
  const [monthly, setMonthly] = useState<{ month: string; income: number; expense: number; net: number }[]>([])
  const [yearly, setYearly] = useState<{ year: number; income: number; expense: number; net: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ tab })
    if (tab === "monthly") params.set("year", String(new Date().getFullYear()))
    axios.get("/api/analytics?" + params.toString())
      .then(({ data }) => {
        if (tab === "overview") setOverview(data)
        else if (tab === "monthly") setMonthly(data.monthly ?? [])
        else if (tab === "yearly") setYearly(data.yearly ?? [])
      })
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Income, expenses, net worth</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            {loading ? <Skeleton className="h-48 w-full" /> : overview ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Income</CardTitle>
                      <TrendingUp className="size-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">{formatAmount(overview.cashFlow.income, currency)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                      <TrendingDown className="size-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-destructive">{formatAmount(overview.cashFlow.expense, currency)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Net worth</CardTitle>
                      <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className={cn("text-2xl font-bold", overview.netWorth >= 0 ? "" : "text-destructive")}>{formatAmount(overview.netWorth, currency)}</p>
                    </CardContent>
                  </Card>
                </div>
                {overview.expenseBreakdown.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">Expense by category</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.expenseBreakdown.map((row) => (
                          <TableRow key={row.name}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.total, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {!overview.expenseBreakdown.length && <p className="text-sm text-muted-foreground">No expense data for this period.</p>}
              </div>
            ) : <p className="text-muted-foreground">No data</p>}
          </TabsContent>
          <TabsContent value="monthly" className="mt-6">
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthly.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell className="text-right text-green-600">{formatAmount(row.income, currency)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatAmount(row.expense, currency)}</TableCell>
                      <TableCell className={cn("text-right", row.net >= 0 ? "" : "text-destructive")}>{formatAmount(row.net, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="yearly" className="mt-6">
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearly.map((row) => (
                    <TableRow key={row.year}>
                      <TableCell>{row.year}</TableCell>
                      <TableCell className="text-right text-green-600">{formatAmount(row.income, currency)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatAmount(row.expense, currency)}</TableCell>
                      <TableCell className={cn("text-right", row.net >= 0 ? "" : "text-destructive")}>{formatAmount(row.net, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
