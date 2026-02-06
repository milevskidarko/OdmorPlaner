import { redirect } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { UserTable } from "@/components/UserTable"
import { getAuthenticatedUser, getUserProfile } from "@/lib/auth-helpers"

export default async function AdminUsersPage() {
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
          <h1 className="text-3xl font-bold mb-6">Управување со вработени</h1>
          <UserTable />
        </main>
      </div>
    </div>
  )
}
