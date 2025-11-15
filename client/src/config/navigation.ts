import type { LucideIcon } from "lucide-react"
import {
  BarChart2,
  Bell,
  Calendar,
  CheckSquare,
  FileText,
  HelpCircle,
  Home,
  Lightbulb,
  Menu,
  Package,
  Repeat,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

export type NavigationBadgeKey =
  | "appointments"
  | "tasks"
  | "talkingPoints"
  | "announcements"
  | "clients"

export type NavigationPlatform = "desktop" | "mobile"

export interface NavigationQuickLink {
  label: string
  href: string
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  order: number
  badgeKey?: NavigationBadgeKey
  description?: string
  quickLinks?: NavigationQuickLink[]
  platforms?: NavigationPlatform[]
}

export interface NavigationWorkspace {
  id: string
  label: string
  description?: string
  items: NavigationItem[]
  quickLinks?: NavigationQuickLink[]
}

const clientManagementWorkspace: NavigationWorkspace = {
  id: "client-management",
  label: "Client Management",
  description: "Day-to-day relationship and servicing workflows",
  items: [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/",
      icon: Home,
      order: 1,
    },
    {
      id: "clients",
      label: "Clients",
      href: "/clients",
      icon: Users,
      order: 2,
      badgeKey: "clients",
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/calendar",
      icon: Calendar,
      order: 4,
      badgeKey: "appointments",
    },
    {
      id: "tasks",
      label: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      order: 5,
      badgeKey: "tasks",
    },
    {
      id: "notes",
      label: "Notes",
      href: "/communications",
      icon: FileText,
      order: 6,
    },
  ],
  quickLinks: [
    {
      label: "Add Client",
      href: "/add-client",
    },
    {
      label: "Book Review",
      href: "/calendar",
    },
  ],
}

const salesPipelineWorkspace: NavigationWorkspace = {
  id: "sales-pipeline",
  label: "Sales Pipeline",
  description: "Prospecting and order workflows",
  items: [
    {
      id: "prospects",
      label: "Prospects",
      href: "/prospects",
      icon: TrendingUp,
      order: 3,
    },
    {
      id: "order-management",
      label: "Order Management",
      href: "/order-management",
      icon: ShoppingCart,
      order: 10,
    },
    {
      id: "sip-builder",
      label: "SIP Builder",
      href: "/sip-builder",
      icon: Repeat,
      order: 11,
    },
  ],
  quickLinks: [
    {
      label: "Add Prospect",
      href: "/add-prospect",
    },
    {
      label: "Create Order",
      href: "/order-management",
    },
  ],
}

const intelligenceWorkspace: NavigationWorkspace = {
  id: "intelligence",
  label: "Intelligence",
  description: "Signals and insights that need attention",
  items: [
    {
      id: "insights",
      label: "Insights",
      href: "/talking-points",
      icon: Lightbulb,
      order: 7,
      badgeKey: "talkingPoints",
    },
    {
      id: "updates",
      label: "Updates",
      href: "/announcements",
      icon: Bell,
      order: 8,
      badgeKey: "announcements",
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/analytics",
      icon: BarChart2,
      order: 13,
    },
  ],
  quickLinks: [
    {
      label: "Talking Points",
      href: "/talking-points",
    },
    {
      label: "Announcements",
      href: "/announcements",
    },
  ],
}

const toolsWorkspace: NavigationWorkspace = {
  id: "tools",
  label: "Tools",
  description: "Productivity features and resources",
  items: [
    {
      id: "products",
      label: "Products",
      href: "/products",
      icon: Package,
      order: 9,
    },
    {
      id: "automation",
      label: "Automation",
      href: "/automation",
      icon: Zap,
      order: 12,
    },
    {
      id: "help-center",
      label: "Help Center",
      href: "/help-center",
      icon: HelpCircle,
      order: 14,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/settings",
      icon: Settings,
      order: 50,
      platforms: ["mobile"],
    },
  ],
  quickLinks: [
    {
      label: "Product Catalog",
      href: "/products",
    },
    {
      label: "Help & Support",
      href: "/help-center",
    },
  ],
}

export const navigationWorkspaces: NavigationWorkspace[] = [
  clientManagementWorkspace,
  salesPipelineWorkspace,
  intelligenceWorkspace,
  toolsWorkspace,
]

const allNavigationItems = navigationWorkspaces.flatMap(
  (workspace) => workspace.items
)

const byPlatform = (platform: NavigationPlatform) =>
  navigationWorkspaces.flatMap((workspace) =>
    workspace.items.filter(
      (item) => !item.platforms || item.platforms.includes(platform)
    )
  )

export const desktopNavigationItems = byPlatform("desktop").sort(
  (a, b) => a.order - b.order
)

export const mobileNavigationItems = byPlatform("mobile").sort(
  (a, b) => a.order - b.order
)

export const navigationItemMap = Object.fromEntries(
  allNavigationItems.map((item) => [item.id, item])
)

export const primaryMobileShortcuts = ["dashboard", "clients", "tasks", "analytics"]

export const bottomNavPrimaryItems = ["dashboard", "calendar", "tasks", "clients"]

export const moreMenuItem: NavigationItem = {
  id: "more",
  label: "More",
  href: "#",
  icon: Menu,
  order: 100,
}

export function findNavigationItem(id: string) {
  return navigationItemMap[id]
}
