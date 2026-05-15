"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ReceiptTextIcon,
  WalletIcon,
  TargetIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from "lucide-react"

// --- FEATURE DATA ---
const features = [
  {
    title: "Smart Ledger",
    description: "Effortlessly log your income and expenses. Auto-categorize your spending and always know exactly where your money is going.",
    icon: ReceiptTextIcon,
    href: "/transactions",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Strict Budgeting",
    description: "Set monthly limits for specific categories like Groceries or Entertainment. Get real-time alerts the moment you overspend.",
    icon: WalletIcon,
    href: "/budgets",
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    title: "Savings Goals",
    description: "Planning a vacation or buying a new car? Create interactive goals, add funds, and watch your progress bar hit 100%.",
    icon: TargetIcon,
    href: "/goals",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Investment Portfolio",
    description: "Track your stocks, crypto, and mutual funds. Fully synced with your ledger using automated double-entry accounting.",
    icon: TrendingUpIcon,
    href: "/investments",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
]

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Check auth state on load
  useEffect(() => {
    setIsMounted(true)
    const token = localStorage.getItem("access")
    setIsLoggedIn(!!token)
  }, [])

  // Prevent hydration mismatch
  if (!isMounted) return null

  // Helper to route unauthenticated users to login
  const getDestination = (path: string) => isLoggedIn ? path : "/login"

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">

      {/* --- TOP BAR --- */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <ShieldCheckIcon className="h-6 w-6 text-primary" />
            <span>BTS</span>
          </div>
          <nav className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="container mx-auto px-4 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[800px] space-y-6"
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Master Your Money with <span className="text-primary">BTS</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
              The ultimate personal finance OS. Track your spending, enforce strict budgets, crush your savings goals, and monitor your investments all in one unified platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href={getDestination("/dashboard")}>
                <Button size="lg" className="w-full sm:w-auto text-md h-12 px-8">
                  {isLoggedIn ? "Open Dashboard" : "Get Started for Free"}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* --- SCROLLING FEATURES SECTION --- */}
        <section className="container mx-auto px-4 py-16 md:py-24 space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.icon
            // Alternate text left/right on desktop
            const isEven = index % 2 === 0

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`flex flex-col gap-8 md:gap-12 items-center ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Feature Graphic/Placeholder */}
                <div className="flex-1 w-full aspect-video md:aspect-square max-h-[400px] rounded-2xl border bg-card flex items-center justify-center shadow-sm relative overflow-hidden group">
                  <div className={`absolute inset-0 opacity-20 ${feature.bg} group-hover:scale-110 transition-transform duration-700`} />
                  <Icon className={`h-32 w-32 ${feature.color} relative z-10 drop-shadow-sm`} />
                </div>

                {/* Feature Text */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${feature.bg} ${feature.color}`}>
                    <Icon className="mr-2 h-4 w-4" />
                    Feature {index + 1}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                    {feature.description}
                  </p>
                  <Link href={getDestination(feature.href)} className="inline-block">
                    <Button variant="outline" size="lg" className="group">
                      Explore {feature.title}
                      <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t py-8 md:py-12 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Budget Tracker System. Built for Demo Day.</p>
        </div>
      </footer>
    </div>
  )
}