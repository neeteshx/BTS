"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { z } from "zod"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlusIcon,
  ArrowUpDownIcon
} from "lucide-react"

export const schema = z.object({
  id: z.number(),
  date: z.string(),
  category_name: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  description: z.string().optional(),
  amount: z.string(),
})

type Transaction = z.infer<typeof schema>

interface Category {
    id: number
    name: string
    type: string
  }

// Define columns outside, but use table.options.meta to access functions inside DataTable
const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.original.date)
      return (
        <div className="text-muted-foreground">
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row, table }) => {
      const meta = table.options.meta as any
      return (
        <Button
          variant="link"
          className="w-fit px-0 text-left font-medium text-foreground"
          onClick={() => meta.openEditDialog(row.original)}
        >
          {row.original.description || "Uncategorized Transaction"}
        </Button>
      )
    },
  },
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        {row.original.category_name || "Uncategorized"}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.amount)
      const isIncome = row.original.type === "INCOME"

      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)

      return (
        <div className={`text-right font-medium ${isIncome ? "text-green-600" : ""}`}>
          {isIncome ? "+" : "-"}{formatted}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as any

      const handleDelete = async () => {
        const token = localStorage.getItem("access")
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${row.original.id}/`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          if (res.ok) {
            toast.success("Transaction deleted")
            window.location.reload()
          } else {
            toast.error("Failed to delete")
          }
        } catch (error) {
          toast.error("Network error")
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta.openEditDialog(row.original)}>
              Edit Transaction
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTable() {
  const [data, setData] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [categories, setCategories] = React.useState<Category[]>([])

  // Add Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [newTxnType, setNewTxnType] = React.useState("EXPENSE")

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingTxn, setEditingTxn] = React.useState<Transaction | null>(null)
  const [editTxnType, setEditTxnType] = React.useState("EXPENSE")

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchTransactions = async () => {
    const token = localStorage.getItem("access")
    if (!token) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const rawData = await res.json()
        setData(rawData)
      }
    } catch (error) {
      toast.error("Failed to fetch transactions")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchTransactions()

    // Fetch categories dynamically
    const fetchCategories = async () => {
      const token = localStorage.getItem("access")
      if (!token) return
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Failed to load categories")
      }
    }
    fetchCategories()
  }, [])

  // --- CREATE ---
  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const payload = {
      description: formData.get("description"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      category_name: formData.get("category"),
      type: formData.get("type"),
    }

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Transaction added")
        setIsAddDialogOpen(false)
        // await fetchTransactions()
        window.location.reload()
      } else {
        toast.error("Failed to add transaction")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- UPDATE ---
  const handleEditTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingTxn) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const payload = {
      description: formData.get("description"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      category_name: formData.get("category"),
      type: formData.get("type"),
    }

    try {
      const token = localStorage.getItem("access")
      // Send PUT request to specific ID
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${editingTxn.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (res.ok) {
        toast.success("Transaction updated")
        setIsEditDialogOpen(false)
        // await fetchTransactions()
        window.location.reload()
      } else {
        toast.error("Failed to update transaction")
      }
    } catch (error) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, pagination },
    // Passing functions down to the columns via meta
    meta: {
      openEditDialog: (txn: Transaction) => {
        setEditingTxn(txn)
        setEditTxnType(txn.type || "EXPENSE")
        setIsEditDialogOpen(true)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading transactions...</div>
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Ledger</h2>

        {/* --- ADD DIALOG --- */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddTransaction}>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Enter the details of your new transaction.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g. Coffee"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newTxnType}
                      onValueChange={setNewTxnType}
                      name="type"
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                        <SelectItem value="INCOME">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category">
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length > 0 ? (
                          categories
                            .filter((cat) => cat.type === newTxnType) // Only show categories matching INCOME or EXPENSE
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            Go to Budgets to create categories!
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* --- EDIT DIALOG --- */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            {editingTxn && (
              <form onSubmit={handleEditTransaction}>
                <DialogHeader>
                  <DialogTitle>Edit Transaction</DialogTitle>
                  <DialogDescription>
                    Make changes to your transaction.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      name="description"
                      defaultValue={editingTxn.description}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="edit-type">Type</Label>
                      <Select
                        value={editTxnType}
                        onValueChange={setEditTxnType}
                        name="type"
                      >
                        <SelectTrigger id="edit-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                          <SelectItem value="INCOME">Income</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category">
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories
                              .filter((cat) => cat.type === newTxnType) // Only show categories matching INCOME or EXPENSE
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              Go to Budgets to create categories!
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="edit-amount">Amount (₹)</Label>
                      <Input
                        id="edit-amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={editingTxn.amount}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="edit-date">Date</Label>
                      <Input
                        id="edit-date"
                        name="date"
                        type="date"
                        defaultValue={editingTxn.date}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Transaction"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}