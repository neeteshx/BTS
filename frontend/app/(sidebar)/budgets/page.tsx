"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { WalletIcon, AlertCircleIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

interface Budget {
  id: number
  category_name: string
  monthly_limit: string
  spent?: number // We will calculate this dynamically
}

interface Transaction {
  amount: string
  category_name: string
  date: string
  type: string
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    const token = localStorage.getItem("access")
    if (!token) return

    try {
      // Fetch both Budgets and Transactions at the same time
      const [budgetsRes, txnsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (budgetsRes.ok && txnsRes.ok) {
        const budgetsData: Budget[] = await budgetsRes.json()
        const txnsData: Transaction[] = await txnsRes.json()

        // 1. Get current month and year
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        // 2. Filter transactions to ONLY include Expenses from THIS month
        const currentMonthExpenses = txnsData.filter((txn) => {
          const txnDate = new Date(txn.date)
          return (
            txn.type === "EXPENSE" &&
            txnDate.getMonth() === currentMonth &&
            txnDate.getFullYear() === currentYear
          )
        })

        // 3. Sum up the spending by category
        const spendingByCategory: Record<string, number> = {}
        currentMonthExpenses.forEach((txn) => {
          const cat = txn.category_name || "Misc"
          spendingByCategory[cat] =
            (spendingByCategory[cat] || 0) + parseFloat(txn.amount)
        })

        // 4. Attach the calculated spent amounts to our budgets
        const combinedBudgets = budgetsData.map((budget) => ({
          ...budget,
          spent: spendingByCategory[budget.category_name] || 0,
        }))

        setBudgets(combinedBudgets)
      }
    } catch (error) {
      toast.error("Failed to load budget data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const payload = {
      category_name: formData.get("category_name"),
      monthly_limit: formData.get("monthly_limit"),
    }

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/budgets/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (res.ok) {
        toast.success("Budget created successfully")
        setIsDialogOpen(false)
        fetchData() // Refresh the data smoothly without reloading the page
      } else {
        toast.error("Failed to create budget")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBudget = async (id: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) return

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/budgets/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.ok) {
        toast.success("Budget removed")
        fetchData()
      } else {
        toast.error("Failed to delete budget")
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Determines the progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500"
    if (percentage >= 80) return "bg-orange-500"
    return "bg-green-500"
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Monthly Budgets</h1>

        {/* ADD BUDGET DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddBudget}>
              <DialogHeader>
                <DialogTitle>Set New Budget</DialogTitle>
                <DialogDescription>
                  Define a spending limit for a specific category.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="category_name">Category Name</Label>
                  <Input
                    id="category_name"
                    name="category_name"
                    placeholder="e.g. Groceries"
                    required
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="monthly_limit">Monthly Limit (₹)</Label>
                  <Input
                    id="monthly_limit"
                    name="monthly_limit"
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Budget"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="mt-10 animate-pulse text-muted-foreground">
          Loading budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-muted-foreground">
          <WalletIcon className="mb-4 h-10 w-10 opacity-50" />
          <p>You haven't set any budgets yet.</p>
          <p className="text-sm">Click "New Budget" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const limit = parseFloat(budget.monthly_limit)
            const spent = budget.spent || 0
            const percentage = Math.min((spent / limit) * 100, 100)
            const isOver = spent > limit

            return (
              <Card key={budget.id} className="group relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {budget.category_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-muted-foreground" />
                    {/* Delete button appears on hover */}
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-700"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatMoney(spent)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {formatMoney(limit)}
                    </span>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-500 ${getProgressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isOver && (
                    <p className="mt-2 flex items-center text-xs font-medium text-red-500">
                      <AlertCircleIcon className="mr-1 h-3 w-3" /> Over budget
                      by {formatMoney(spent - limit)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
