"use client"

import { DataTable } from "@/components/data-table"

export default function TransactionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">
          Transaction History
        </h1>
      </div>
      <div className="mt-4">
        <DataTable />
      </div>
    </div>
  )
}
