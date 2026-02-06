import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { MobileSidebar } from "@/components/MobileSidebar"
import { VacationCard } from "@/components/VacationCard"
import Link from "next/link"
import { FileText, Users, Calendar as CalendarIcon } from "lucide-react"
import { getAuthenticatedUser, getUserProfile } from "@/lib/auth-helpers"

export default async function AdminDashboard() {
  const authenticatedUser = await getAuthenticatedUser()

  if (!authenticatedUser) {
    redirect("/login")
  }

  const { profile } = await getUserProfile(authenticatedUser.id)

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  const supabase = await createClient()

  // Get pending requests
  const { data: pendingVacations } = await supabase
    .from("vacations")
    .select("*, profiles(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get today's approved vacations
  const today = new Date().toISOString().split("T")[0]
  const { data: todayVacations } = await supabase
    .from("vacations")
    .select("*, profiles(full_name, email)")
    .eq("status", "approved")
    .lte("date_from", today)
    .gte("date_to", today)

  // Get monthly stats
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const { data: monthlyVacations } = await supabase
    .from("vacations")
    .select("days_total, status")
    .eq("status", "approved")
    .gte("date_from", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
    .lte("date_from", `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`)

  const totalDaysThisMonth = monthlyVacations?.reduce((sum: number, v: any) => sum + v.days_total, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={authenticatedUser} role="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <div className="md:hidden fixed top-16 left-4 z-50">
          <MobileSidebar role="admin" />
        </div>
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Админ Преглед</h1>
            <p className="text-gray-600">
              Како администратор, можете да ги одобрувате или одбивате барањата за одмор од вработените.
              Барањата се прикажани подолу и можете да ги управувате од страницата <strong>Барања</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Барања во тек</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {pendingVacations?.length || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Одмори денес</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {todayVacations?.length || 0}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Одобрени денови овој месец</h3>
                  <p className="text-3xl font-bold text-blue-600">{totalDaysThisMonth}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Неодамнешни барања</h2>
              <Link
                href="/dashboard/admin/vacations"
                className="text-primary hover:underline text-sm"
              >
                Види сите →
              </Link>
            </div>
            {pendingVacations && pendingVacations.length > 0 ? (
              pendingVacations.map((vacation: any) => (
                <VacationCard
                  key={vacation.id}
                  vacation={vacation}
                  showActions={true}
                />
              ))
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                Нема барања во тек
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
