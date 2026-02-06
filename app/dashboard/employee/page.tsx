import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { VacationCard } from "@/components/VacationCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { getUserProfile } from "@/lib/auth-helpers"


export default async function EmployeeDashboard() {
  const supabase = await createClient()
  
  // Try to set session from cookie first to ensure RLS context is established
  const cookieStore = await import('next/headers').then(m => m.cookies())
  const authTokenCookie = cookieStore.get('sb-xzjbizaszabvuuqxzwlt-auth-token')
  
  let authenticatedUser = null
  
  if (authTokenCookie) {
    try {
      const cookieData = JSON.parse(authTokenCookie.value)
      if (cookieData.access_token) {
        console.log("🔵 [EMPLOYEE] Setting session from cookie for RLS context...")
        const { data: { session: setSessionData }, error: setError } = await supabase.auth.setSession({
          access_token: cookieData.access_token,
          refresh_token: cookieData.refresh_token || ''
        })
        if (setSessionData && !setError) {
          authenticatedUser = setSessionData.user
          console.log("✅ [EMPLOYEE] Session set successfully, user:", authenticatedUser.id)
        } else {
          console.log("🔵 [EMPLOYEE] setSession failed:", setError?.message)
        }
      }
    } catch (e: any) {
      console.log("🔵 [EMPLOYEE] Failed to parse cookie:", e.message)
    }
  }
  
  // Now call getUser() to establish RLS context - this makes auth.uid() available
  // Even if we got user from setSession(), we need getUser() for RLS
  const { data: { user: rlsUser }, error: rlsError } = await supabase.auth.getUser()
  
  console.log("🔵 [EMPLOYEE] RLS context check:", {
    hasRLSUser: !!rlsUser,
    rlsUserId: rlsUser?.id,
    matchesSetSession: rlsUser?.id === authenticatedUser?.id,
    rlsError: rlsError?.message
  })
  
  // Use RLS user if available, otherwise fall back to setSession user
  if (rlsUser) {
    authenticatedUser = rlsUser
    console.log("✅ [EMPLOYEE] Using RLS user:", authenticatedUser.id)
  } else if (!authenticatedUser) {
    console.log("❌ [EMPLOYEE] Нема корисник, редиректирање на /login")
    redirect("/login")
  }
  
  console.log("✅ [EMPLOYEE] Final authenticated user:", authenticatedUser.id)

  console.log("🔵 [EMPLOYEE] Читање на профил за:", authenticatedUser.id)
  
  // Use getUserProfile helper which handles session setup
  let { profile, profileError } = await getUserProfile(authenticatedUser.id)

  console.log("🔵 [EMPLOYEE] Profile check:", { 
    hasProfile: !!profile, 
    role: profile?.role,
    profileError: profileError?.message,
    errorCode: profileError?.code 
  })
  
  // If profile shows admin role, redirect to admin dashboard immediately
  if (profile && profile.role === "admin") {
    console.log("✅ [EMPLOYEE] User is admin, redirecting to admin dashboard")
    redirect("/dashboard/admin")
  }

  // If profile doesn't exist, try to create it (but don't fail if RLS blocks it)
  if (!profile) {
    console.log("🔵 [EMPLOYEE] Профилот не постои, обидување за креирање...")
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: authenticatedUser.id,
        email: authenticatedUser.email!,
        full_name: authenticatedUser.user_metadata?.full_name || null,
        role: authenticatedUser.user_metadata?.role || "employee",
        company: authenticatedUser.user_metadata?.company || null,
      })
      .select()
      .maybeSingle()

    if (!insertError && newProfile) {
      profile = newProfile
    } else if (insertError) {
      // Try to fetch again in case it was created by trigger
      const { profile: existingProfile } = await getUserProfile(authenticatedUser.id)
      profile = existingProfile
    }
  }

  // Check again if profile is admin after creation/fetch
  if (profile && profile.role === "admin") {
    console.log("✅ [EMPLOYEE] User is admin (after fetch), redirecting to admin dashboard")
    redirect("/dashboard/admin")
  }

  // If no profile, use default role "employee"
  const userRole = profile?.role || "employee"
  
  console.log("✅ [EMPLOYEE] Користење role:", userRole)
  
  if (profile && profile.role !== "employee" && profile.role !== "admin") {
    console.log("❌ [EMPLOYEE] Невалиден role, редиректирање на /")
    redirect("/")
  }

  console.log("🔵 [EMPLOYEE] Fetching vacations for user:", authenticatedUser.id)
  
  // Use RPC function to bypass RLS since auth.uid() is not available in server components
  // This function uses SECURITY DEFINER to safely query vacations for the authenticated user
  const { data: vacations, error: vacationsError } = await supabase
    .rpc('get_user_vacations', { target_user_id: authenticatedUser.id })
  
  console.log("🔵 [EMPLOYEE] Vacations fetch result (via RPC):", {
    count: vacations?.length || 0,
    error: vacationsError?.message,
    errorCode: vacationsError?.code,
    firstVacationUserId: vacations?.[0]?.user_id,
    allUserIds: vacations?.map((v: any) => v.user_id)
  })
  
  // Use vacations directly from RPC function
  const userVacations = vacations || []
  
  console.log("🔵 [EMPLOYEE] User vacations:", {
    count: userVacations.length,
    vacations: userVacations.map((v: any) => ({ id: v.id, user_id: v.user_id, days_total: v.days_total, status: v.status }))
  })

  const pendingCount = userVacations.filter((v: any) => v.status === "pending").length || 0
  const approvedDays = userVacations
    .filter((v: any) => v.status === "approved")
    .reduce((sum: number, v: any) => sum + v.days_total, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={authenticatedUser} role={userRole as "admin" | "employee"} />
      <div className="flex">
        <Sidebar role={userRole as "admin" | "employee"} />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">Мои одмори</h1>
              <Link href="/dashboard/employee/new-request">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ново барање
                </Button>
              </Link>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Како работи процесот:</strong> Поднесете ново барање за одмор преку "Нов одмор".
                Администраторот ќе го прегледа и одобри или одбие вашето барање. Можете да ги видите сите ваши барања и нивниот статус подолу.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-600 mb-2">Барања во тек</h3>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-600 mb-2">Одобрени денови</h3>
              <p className="text-3xl font-bold text-green-600">{approvedDays}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm text-gray-600 mb-2">Вкупно барања</h3>
              <p className="text-3xl font-bold text-blue-600">{userVacations.length || 0}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Историја на барања</h2>
            {userVacations && userVacations.length > 0 ? (
              userVacations.map((vacation: any) => (
                <VacationCard key={vacation.id} vacation={vacation} showActions={false} />
              ))
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                Немате поднесено барања за одмор
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
