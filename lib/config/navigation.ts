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
    url: "/accounts",
    icon: Wallet,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: PiggyBank,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Goals & Savings",
    url: "/goals",
    icon: Target,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    items: [
      { title: "Profile", url: "/settings/profile" },
      { title: "General", url: "/settings" },
    ],
  },
]
