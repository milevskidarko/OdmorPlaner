import { redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { CalendarView } from "@/components/CalendarView"
import { getAuthenticatedUser, getUserProfile } from "@/lib/auth-helpers"

export default async function EmployeeCalendarPage() {
  const authenticatedUser = await getAuthenticatedUser()

  if (!authenticatedUser) {
    redirect("/login")
  }

  const { profile } = await getUserProfile(authenticatedUser.id)

  // Use default role if no profile
  const userRole = profile?.role || "employee"
  
  if (profile && profile.role !== "employee" && profile.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={authenticatedUser} role={userRole as "admin" | "employee"} />
      <div className="flex">
        <Sidebar role={userRole as "admin" | "employee"} />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Календар на одмори</h1>
          <CalendarView isAdmin={false} />
        </main>
      </div>
    </div>
  )
}
