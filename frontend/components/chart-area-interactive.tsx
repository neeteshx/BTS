"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Define the shape of our transformed data
interface DailyData {
  date: string
  income: number
  expenses: number
}

// Custom chart config for financial data
const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(142, 76%, 36%)", // Green
  },
  expenses: {
    label: "Expenses",
    color: "hsl(346, 87%, 43%)", // Red
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<DailyData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Fetch and transform data from Django
  React.useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("access")
      if (!token) return

      try {
        const res = await fetch(
          "http://192.168.29.155:8000/api/transactions/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (res.ok) {
          const rawData = await res.json()

          // 1. Create a map to group transactions by date
          const groupedByDate: Record<string, DailyData> = {}

          rawData.forEach((txn: any) => {
            const dateStr = txn.date
            if (!groupedByDate[dateStr]) {
              groupedByDate[dateStr] = { date: dateStr, income: 0, expenses: 0 }
            }

            // Hackathon logic: Since we didn't explicitly send "type" in the transaction API,
            // we will assume categories named "Income", "Salary", or "Bonus" are income.
            const catName = txn.category_name?.toLowerCase() || ""
            const amount = parseFloat(txn.amount)

            if (catName.includes("income") || catName.includes("salary")) {
              groupedByDate[dateStr].income += amount
            } else {
              groupedByDate[dateStr].expenses += amount
            }
          })

          // 2. Convert to array and sort by date chronologically
          const sortedData = Object.values(groupedByDate).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )

          setChartData(sortedData)
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Filter the data based on the selected time range (relative to TODAY)
  const filteredData = React.useMemo(() => {
    const today = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date()
    startDate.setDate(today.getDate() - daysToSubtract)

    return chartData.filter((item) => new Date(item.date) >= startDate)
  }, [chartData, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Cash Flow Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Income vs. Expenses over the selected period
          </span>
          <span className="@[540px]/card:hidden">Income vs. Expenses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => {
              if (val) setTimeRange(val)
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-[250px] w-full animate-pulse items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
            No transactions found for this period. Add some in Django Admin!
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig.income.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig.income.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig.expenses.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig.expenses.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="expenses"
                type="monotone"
                fill="url(#fillExpenses)"
                stroke={chartConfig.expenses.color}
                stackId="a"
              />
              <Area
                dataKey="income"
                type="monotone"
                fill="url(#fillIncome)"
                stroke={chartConfig.income.color}
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
