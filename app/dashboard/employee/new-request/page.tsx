import { redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { RequestForm } from "@/components/RequestForm"
import { getAuthenticatedUser, getUserProfile } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
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

  // Fetch vacation data if editing
  let vacationData = null
  if (searchParams.edit) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("vacations")
      .select("*")
      .eq("id", searchParams.edit)
      .eq("user_id", authenticatedUser.id)
      .eq("status", "pending")
      .maybeSingle()
    
    if (data) {
      vacationData = {
        type: data.type,
        date_from: data.date_from,
        date_to: data.date_to,
        comment: data.comment,
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={authenticatedUser} role={userRole as "admin" | "employee"} />
      <div className="flex">
        <Sidebar role={userRole as "admin" | "employee"} />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">
            {vacationData ? "Уреди барање за одмор" : "Поднеси ново барање за одмор"}
          </h1>
          <RequestForm 
            userId={authenticatedUser.id} 
            vacationId={searchParams.edit}
            initialData={vacationData || undefined}
          />
        </main>
      </div>
    </div>
  )
}
