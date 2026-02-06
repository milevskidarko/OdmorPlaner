"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/cn"
import { Calendar, FileText, Home, PlusCircle, Users } from "lucide-react"

interface SidebarProps {
  role: "admin" | "employee"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const employeeLinks = [
    { href: "/dashboard/employee", label: "Мои одмори", icon: Home },
    { href: "/dashboard/employee/new-request", label: "Нов одмор", icon: PlusCircle },
    { href: "/dashboard/employee/calendar", label: "Календар", icon: Calendar },
  ]

  const adminLinks = [
    { href: "/dashboard/admin", label: "Преглед", icon: Home },
    { href: "/dashboard/admin/vacations", label: "Барања", icon: FileText },
    { href: "/dashboard/admin/calendar", label: "Календар", icon: Calendar },
    { href: "/dashboard/admin/users", label: "Вработени", icon: Users },
  ]

  const links = role === "admin" ? adminLinks : employeeLinks

  return (
    <aside className="hidden md:block w-64 bg-gray-50 border-r min-h-screen p-4">
      <div className="mb-4 pb-4 border-b">
        <div className="text-xs text-gray-500 mb-1">Улога</div>
        <div className={cn(
          "text-sm font-semibold",
          role === "admin" ? "text-purple-600" : "text-blue-600"
        )}>
          {role === "admin" ? "👑 Администратор" : "👤 Вработен"}
        </div>
        {role === "admin" && (
          <div className="text-xs text-gray-500 mt-1">
            Можете да одобрувате барања
          </div>
        )}
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
