"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"

export function UserTable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "employee",
    position: "",
    company: "",
  })
  const supabase = createClient()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          position: formData.position,
          company: formData.company,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Грешка при додавање на корисник")
      }

      setShowAddForm(false)
      setFormData({ email: "", full_name: "", role: "employee", position: "", company: "" })
      fetchUsers()
    } catch (error: any) {
      alert(error.message || "Грешка при додавање на корисник")
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          position: formData.position || null,
          company: formData.company || null,
        })
        .eq("id", editingUser.id)

      if (error) throw error

      setEditingUser(null)
      setFormData({ email: "", full_name: "", role: "employee", position: "", company: "" })
      fetchUsers()
    } catch (error: any) {
      alert(error.message || "Грешка при ажурирање на корисник")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Дали сте сигурни дека сакате да го избришете овој корисник?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Грешка при бришење на корисник")
      }

      fetchUsers()
    } catch (error: any) {
      alert(error.message || "Грешка при бришење на корисник")
    }
  }

  const startEdit = (user: any) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name || "",
      role: user.role,
      position: user.position || "",
      company: user.company || "",
    })
    setShowAddForm(true)
  }

  if (loading) {
    return <div className="text-center py-8">Вчитување...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Листа на вработени</h2>
        <Button onClick={() => {
          setShowAddForm(!showAddForm)
          setEditingUser(null)
          setFormData({ email: "", full_name: "", role: "employee", position: "", company: "" })
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Додади вработен
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? "Уреди вработен" : "Додади нов вработен"}
            </h3>
            <div className="space-y-4">
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="full_name">Име и презиме</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Улога</Label>
                <Select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="employee">Вработен</option>
                  <option value="admin">Администратор</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Позиција</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="На пример: Развивач, Менаџер..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                >
                  {editingUser ? "Зачувај промени" : "Додади"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingUser(null)
                  }}
                >
                  Откажи
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Име
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Компанија
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Позиција
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Улога
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Акции
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.full_name || "Непознато"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.company || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.position || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {user.role === "admin" ? "Админ" : "Вработен"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
