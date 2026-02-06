"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Shield, Briefcase } from "lucide-react"
import { useEffect, useState } from "react"
import { Notifications } from "@/components/Notifications"

interface NavbarProps {
  user: {
    email?: string
    full_name?: string | null
  }
  role?: "admin" | "employee"
}

export function Navbar({ user, role }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<"admin" | "employee" | null>(role || null)

  // Fetch role if not provided or if role prop changed
  useEffect(() => {
    const fetchRole = async () => {
      // If role is provided as prop, use it
      if (role) {
        setUserRole(role)
        return
      }

      // Otherwise, fetch from database
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        console.log("🔵 [Navbar] Fetching profile for user:", authUser.id)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", authUser.id)
          .maybeSingle()

        console.log("🔵 [Navbar] Profile fetch result:", {
          hasProfile: !!profile,
          role: profile?.role,
          error: profileError?.message,
          errorCode: profileError?.code
        })

        if (profile?.role === "admin" || profile?.role === "employee") {
          setUserRole(profile.role)
          console.log("✅ [Navbar] Role set to:", profile.role)
        } else {
          console.log("⚠️ [Navbar] Invalid or missing role, defaulting to employee")
          setUserRole("employee")
        }
      }
    }
    fetchRole()
  }, [role, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-primary">Одмор Планер</h1>
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span>{user.full_name || user.email}</span>
            {userRole && (
              <Badge
                variant="outline"
                className={userRole === "admin"
                  ? "bg-purple-100 text-purple-800 border-purple-300"
                  : "bg-blue-100 text-blue-800 border-blue-300"
                }
              >
                {userRole === "admin" ? (
                  <>
                    <Shield className="h-3 w-3 mr-1" />
                    Администратор
                  </>
                ) : (
                  <>
                    <Briefcase className="h-3 w-3 mr-1" />
                    Вработен
                  </>
                )}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Одјави се
          </Button>
        </div>
      </div>
    </nav>
  )
}
