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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUpIcon, TrendingDownIcon, PlusIcon, Trash2Icon, BriefcaseIcon } from "lucide-react"
import { toast } from "sonner"

interface InvestmentAsset {
  id: number
  symbol_or_name: string
  asset_type: string
  total_shares: string
  average_buy_price: string
}

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<InvestmentAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchAssets = async () => {
    const token = localStorage.getItem("access")
    if (!token) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/investments/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAssets(data)
      }
    } catch (error) {
      toast.error("Failed to load portfolio")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("new=true")
    ) {
      setIsDialogOpen(true) // Pops the modal open!
      window.history.replaceState({}, "", window.location.pathname) // Cleans the URL instantly
    }
  }, [])

  const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const payload = {
      symbol_or_name: formData.get("symbol_or_name"),
      asset_type: formData.get("asset_type"),
      total_shares: formData.get("total_shares"),
      average_buy_price: formData.get("average_buy_price"),
    }

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/investments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Asset added to portfolio")
        setIsDialogOpen(false)
        window.location.reload() // The Hackathon Hammer!
      } else {
        toast.error("Failed to add asset")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAsset = async (id: number) => {
    if (!confirm("Remove this asset from your portfolio?")) return

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/investments/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success("Asset removed")
        window.location.reload()
      } else {
        toast.error("Failed to delete asset")
      }
    } catch (error) {
      toast.error("Network error")
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  // --- HACKATHON MAGIC: Fake Market Data Generator ---
  // We use the asset's ID to deterministically generate a fake "return"
  // so it looks like live market data but stays consistent on refresh!
  const getMockMarketData = (asset: InvestmentAsset) => {
    const buyPrice = parseFloat(asset.average_buy_price)
    const shares = parseFloat(asset.total_shares)
    const investedAmount = buyPrice * shares

    // Pseudo-random performance based on ID:
    // Evens go up up to 25%, Odds go down up to 8%
    const mockReturnPercent = asset.id % 2 === 0
      ? (asset.id * 3.4) % 25
      : -((asset.id * 2.1) % 8)

    const currentPrice = buyPrice * (1 + (mockReturnPercent / 100))
    const currentValue = shares * currentPrice
    const profitLoss = currentValue - investedAmount

    return { investedAmount, currentValue, profitLoss, mockReturnPercent }
  }

  // Calculate totals for the top dashboard
  const totalPortfolioValue = assets.reduce((sum, asset) => sum + getMockMarketData(asset).currentValue, 0)
  const totalInvested = assets.reduce((sum, asset) => sum + getMockMarketData(asset).investedAmount, 0)
  const totalProfitLoss = totalPortfolioValue - totalInvested
  const totalReturnPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Investment Portfolio</h1>

        {/* ADD ASSET DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddAsset}>
              <DialogHeader>
                <DialogTitle>Add to Portfolio</DialogTitle>
                <DialogDescription>
                  Record a new stock, crypto, or mutual fund purchase.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="symbol_or_name">Symbol / Name</Label>
                    <Input id="symbol_or_name" name="symbol_or_name" placeholder="e.g. AAPL, BTC" required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="asset_type">Asset Type</Label>
                    <Select name="asset_type" defaultValue="STOCK">
                      <SelectTrigger id="asset_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK">Stock</SelectItem>
                        <SelectItem value="CRYPTO">Crypto</SelectItem>
                        <SelectItem value="MUTUAL_FUND">Mutual Fund</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="total_shares">Number of Shares</Label>
                    <Input id="total_shares" name="total_shares" type="number" step="0.0001" placeholder="10" required />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="average_buy_price">Avg Buy Price (₹)</Label>
                    <Input id="average_buy_price" name="average_buy_price" type="number" step="0.01" placeholder="1500.00" required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Asset"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* PORTFOLIO OVERVIEW CARD */}
      <Card className="bg-muted/30 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Portfolio Value</p>
              <h2 className="text-4xl font-bold">{formatMoney(totalPortfolioValue)}</h2>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Returns</p>
              <div className={`flex items-center md:justify-end text-xl font-semibold ${totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalProfitLoss >= 0 ? <TrendingUpIcon className="mr-2 h-5 w-5" /> : <TrendingDownIcon className="mr-2 h-5 w-5" />}
                {totalProfitLoss >= 0 ? "+" : ""}{formatMoney(totalProfitLoss)} ({totalReturnPercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ASSET GRID */}
      {isLoading ? (
        <div className="text-muted-foreground animate-pulse mt-10">Loading portfolio...</div>
      ) : assets.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
          <BriefcaseIcon className="h-10 w-10 mb-4 opacity-50" />
          <p>Your portfolio is empty.</p>
          <p className="text-sm">Click "Add Asset" to track your first investment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
          {assets.map((asset) => {
            const { currentValue, mockReturnPercent, profitLoss } = getMockMarketData(asset)
            const isPositive = mockReturnPercent >= 0

            return (
              <Card key={asset.id} className="relative group hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-bold">{asset.symbol_or_name}</CardTitle>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{asset.asset_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <TrendingUpIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDownIcon className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMoney(currentValue)}</div>
                  <div className={`flex items-center justify-between mt-2 text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
                    <span>{isPositive ? "+" : ""}{mockReturnPercent.toFixed(2)}%</span>
                    <span className="font-medium">{isPositive ? "+" : ""}{formatMoney(profitLoss)}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
                    <span>Shares: {parseFloat(asset.total_shares).toFixed(4)}</span>
                    <span>Avg Buy: {formatMoney(parseFloat(asset.average_buy_price))}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}