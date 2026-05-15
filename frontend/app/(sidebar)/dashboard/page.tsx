"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSignIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

// Placeholders for the components we will build next
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"

interface DashboardData {
  month: number
  year: number
  total_income: number
  total_expenses: number
  net_balance: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access")

      if (!token) {
        window.location.href = "/login"
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const result = await res.json()
          setData(result)
        } else if (res.status === 401) {
          localStorage.removeItem("access")
          window.location.href = "/login"
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
          {/* --- 1. The Metric Cards --- */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Income
                </CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : formatMoney(data?.total_income || 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  For current month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? "..." : formatMoney(data?.total_expenses || 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  For current month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Balance
                </CardTitle>
                <DollarSignIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : formatMoney(data?.net_balance || 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Remaining funds
                </p>
              </CardContent>
            </Card>
          </div>

          {/* --- 2. The Chart Area --- */}
          <div className="grid gap-4 md:grid-cols-1">
            <ChartAreaInteractive />
          </div>

          {/* --- 3. The Data Table --- */}
          <div className="mt-4">
            <h3 className="mb-4 text-lg font-medium">Recent Transactions</h3>
            <DataTable />
          </div>
        </div>
      </div>
    </div>
  )
}
