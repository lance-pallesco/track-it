/**
 * Sidebar navigation configuration.
 * Centralized for easy scaling and route management.
 */

import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  Target,
  Settings,
  User,
} from "lucide-react"
import type { NavItem } from "@/components/nav-main"

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Accounts",
    url: "/dashboard/accounts",
    icon: Wallet,
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Budgets",
    url: "/dashboard/budgets",
    icon: PiggyBank,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Goals & Savings",
    url: "/dashboard/goals",
    icon: Target,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    items: [
      { title: "Profile", url: "/dashboard/settings/profile" },
      { title: "General", url: "/dashboard/settings" },
    ],
  },
]
