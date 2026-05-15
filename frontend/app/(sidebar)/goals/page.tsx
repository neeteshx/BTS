"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { TargetIcon, TrophyIcon, PlusIcon, Trash2Icon, ArrowUpCircleIcon } from "lucide-react"
import { toast } from "sonner"

interface Goal {
  id: number
  name: string
  target_amount: string
  current_amount: string
  is_completed: boolean
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchGoals = async () => {
    const token = localStorage.getItem("access")
    if (!token) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch (error) {
      toast.error("Failed to load goals")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("new=true")
    ) {
      setIsAddDialogOpen(true) // Pops the modal open!
      window.history.replaceState({}, "", window.location.pathname) // Cleans the URL instantly
    }
  }, [])

  const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const payload = {
      name: formData.get("name"),
      target_amount: formData.get("target_amount"),
      current_amount: formData.get("current_amount") || "0",
    }

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Goal created!")
        setIsAddDialogOpen(false)
        fetchGoals()
      } else {
        toast.error("Failed to create goal")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProgress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedGoal) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const amountToAdd = parseFloat(formData.get("add_amount") as string)
    const newTotal = parseFloat(selectedGoal.current_amount) + amountToAdd

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals/${selectedGoal.id}/`, {
        method: "PATCH", // PATCH because we are only updating specific fields
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_amount: newTotal }),
      })

      if (res.ok) {
        toast.success("Progress updated!")
        setIsUpdateDialogOpen(false)
        fetchGoals()
      } else {
        toast.error("Failed to update progress")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this goal?")) return

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success("Goal removed")
        fetchGoals()
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  const formatMoney = (amount: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Savings Goals</h1>

        {/* ADD GOAL DIALOG */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddGoal}>
              <DialogHeader>
                <DialogTitle>Create a Savings Goal</DialogTitle>
                <DialogDescription>What are you saving up for?</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input id="name" name="name" placeholder="e.g. New Car, Vacation" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="target_amount">Target Amount (₹)</Label>
                    <Input id="target_amount" name="target_amount" type="number" step="0.01" required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="current_amount">Already Saved (₹)</Label>
                    <Input id="current_amount" name="current_amount" type="number" step="0.01" defaultValue="0" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Goal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse mt-10">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
          <TargetIcon className="h-10 w-10 mb-4 opacity-50" />
          <p>You haven't set any savings goals yet.</p>
          <p className="text-sm">Click "New Goal" to start planning your future.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const current = parseFloat(goal.current_amount)
            const target = parseFloat(goal.target_amount)
            const percentage = Math.min((current / target) * 100, 100)
            const isComplete = goal.is_completed

            return (
              <Card key={goal.id} className={`relative group transition-colors ${isComplete ? "border-yellow-500/50 bg-yellow-500/5" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    {isComplete ? <TrophyIcon className="h-5 w-5 text-yellow-500" /> : <TargetIcon className="h-5 w-5 text-primary" />}
                    {goal.name}
                  </CardTitle>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-2xl font-bold mt-2">
                    {formatMoney(current)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {formatMoney(target)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs mt-4 mb-2 text-muted-foreground font-medium">
                    <span>{percentage.toFixed(0)}% Complete</span>
                    {!isComplete && <span>{formatMoney(target - current)} remaining</span>}
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${isComplete ? "bg-yellow-500" : "bg-primary"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </CardContent>

                {!isComplete && (
                  <CardFooter className="pt-0">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        setSelectedGoal(goal)
                        setIsUpdateDialogOpen(true)
                      }}
                    >
                      <ArrowUpCircleIcon className="mr-2 h-4 w-4" />
                      Add Funds
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* UPDATE PROGRESS DIALOG */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleUpdateProgress}>
            <DialogHeader>
              <DialogTitle>Update Goal Progress</DialogTitle>
              <DialogDescription>
                Add money to your "{selectedGoal?.name}" goal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="flex flex-col gap-3">
                <Label htmlFor="add_amount">Amount to Add (₹)</Label>
                <Input id="add_amount" name="add_amount" type="number" step="0.01" placeholder="e.g. 500" autoFocus required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Add to Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}