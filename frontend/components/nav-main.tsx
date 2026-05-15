"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  CirclePlusIcon,
  BellIcon,
  ReceiptTextIcon,
  WalletIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* --- GLOBAL SHORTCUT BUTTONS --- */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {/* 1. Quick Create Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <CirclePlusIcon />
                  <span>Quick Create</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                align="start"
                side="right"
                sideOffset={8}
              >
                <DropdownMenuLabel>Create New...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = "/transactions?new=true")
                    }
                    className="cursor-pointer"
                  >
                    <ReceiptTextIcon className="mr-2 h-4 w-4" />
                    <span>Transaction</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/budgets?new=true")}
                    className="cursor-pointer"
                  >
                    <WalletIcon className="mr-2 h-4 w-4" />
                    <span>Budget Limit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/goals?new=true")}
                    className="cursor-pointer"
                  >
                    <TargetIcon className="mr-2 h-4 w-4" />
                    <span>Savings Goal</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = "/investments?new=true")
                    }
                    className="cursor-pointer"
                  >
                    <TrendingUpIcon className="mr-2 h-4 w-4" />
                    <span>Investment Asset</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* --- STANDARD NAVIGATION LINKS --- */}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.url}>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
