"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DownloadIcon, FileTextIcon } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const handleDownload = () => {
    // Fake the download for the demo
    toast.success("Generating PDF report...")
    setTimeout(() => toast.success("Download complete!"), 2000)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Monthly Reports</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {["April 2026", "March 2026", "February 2026"].map((month) => (
          <Card key={month}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileTextIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-md">{month} Summary</CardTitle>
                <CardDescription>PDF Document • 2.4 MB</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownload}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
