"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState<"admin" | "employee">("employee")
  const [adminCode, setAdminCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate admin code if trying to register as admin
      if (role === "admin" && adminCode !== "ADMIN2024") {
        throw new Error("Невалиден код за администратор")
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            company: company,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (signUpError) {
        // Handle rate limiting specifically
        if (signUpError.message.includes("rate_limit") || signUpError.message.includes("after")) {
          const match = signUpError.message.match(/(\d+)\s+seconds?/i)
          const seconds = match ? match[1] : "неколку"
          throw new Error(`Премногу обиди. Ве молиме почекајте ${seconds} секунди пред повторен обид.`)
        }
        throw signUpError
      }

      // The trigger handle_new_user() will automatically create the profile
      // It uses SECURITY DEFINER to bypass RLS, so it will work even if auth.uid() is not available
      // The profile will be created with the metadata from signUp options

      // Show success message
      setError(null)
      alert("Регистрацијата е успешна! Проверете го вашиот email за потврда.")
      router.push("/login")
    } catch (error: any) {
      setError(error.message || "Грешка при регистрација")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Регистрација</CardTitle>
          <CardDescription className="text-center">
            Креирајте нов профил
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Име и презиме</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Име Презиме"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vashe.ime@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Компанија</Label>
              <Input
                id="company"
                type="text"
                placeholder="Име на компанија"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Улога</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "employee")}
                required
              >
                <option value="employee">Вработен</option>
                <option value="admin">Администратор</option>
              </Select>
            </div>
            {role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="adminCode">Код за администратор</Label>
                <Input
                  id="adminCode"
                  type="password"
                  placeholder="Внесете го кодот за администратор"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Код: ADMIN2024</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Лозинка</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Регистрирање..." : "Регистрирај се"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Веќе имате профил? Најавете се
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
