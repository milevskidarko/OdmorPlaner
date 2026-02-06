import { redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { VacationList } from "@/components/VacationList"
import { getAuthenticatedUser, getUserProfile } from "@/lib/auth-helpers"

export default async function AdminVacationsPage() {
  const authenticatedUser = await getAuthenticatedUser()

  if (!authenticatedUser) {
    redirect("/login")
  }

  const { profile } = await getUserProfile(authenticatedUser.id)

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={authenticatedUser} role="admin" />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Сите барања за одмор</h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Како работи одобрувањето:</strong> Вработените поднесуваат барања за одмор кои се прикажани овде.
                Можете да ги одобрите (✓) или одбиете (✗) барањата со статус "Во тек". Одобрените барања се прикажани во календарот.
              </p>
            </div>
          </div>
          <VacationList />
        </main>
      </div>
    </div>
  )
}
