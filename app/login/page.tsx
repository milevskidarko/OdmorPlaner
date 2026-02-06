"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    console.log("🔵 [LOGIN] Почеток на најава...")

    try {
      console.log("🔵 [LOGIN] Обид за најава со:", email)
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("🔵 [LOGIN] Auth response:", { 
        hasUser: !!data?.user, 
        hasError: !!authError,
        errorMessage: authError?.message 
      })

      if (authError) {
        console.error("❌ [LOGIN] Auth грешка:", authError)
        // Better error messages
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Погрешен email или лозинка")
        } else if (authError.message.includes("Email not confirmed")) {
          throw new Error("Email не е потврден. Проверете го вашиот email.")
        } else {
          throw authError
        }
      }

      if (!data.user) {
        console.error("❌ [LOGIN] Нема корисник во response")
        throw new Error("Неуспешна најава")
      }

      console.log("✅ [LOGIN] Корисник успешно најавен:", data.user.id)

      // Ensure session is properly set
      console.log("🔵 [LOGIN] Проверка на сесија...")
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      console.log("🔵 [LOGIN] Session data:", { 
        hasSession: !!sessionData?.session,
        accessToken: sessionData?.session?.access_token ? "exists" : "missing",
        sessionError: sessionError?.message 
      })
      
      if (!sessionData.session) {
        console.error("❌ [LOGIN] Сесијата не е зачувана")
        throw new Error("Сесијата не е зачувана. Обидете се повторно.")
      }

      console.log("✅ [LOGIN] Сесијата е зачувана")
      
      // Check cookies
      const cookies = document.cookie
      console.log("🔵 [LOGIN] Cookies:", cookies)
      
      // Wait longer for cookies to be properly set and synced
      console.log("🔵 [LOGIN] Чекање за cookies да се синхронизираат...")
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify session again before redirect
      const { data: verifySession } = await supabase.auth.getSession()
      console.log("🔵 [LOGIN] Final session check:", { 
        hasSession: !!verifySession?.session 
      })
      
      console.log("🔵 [LOGIN] Редиректирање на /")
      
      // Use window.location.replace to avoid back button issues
      window.location.replace("/")
    } catch (error: any) {
      console.error("❌ [LOGIN] КРАЈНА ГРЕШКА:", error)
      setError(error.message || "Грешка при најава")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Најава</CardTitle>
          <CardDescription className="text-center">
            Најавете се во вашиот профил
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              <Label htmlFor="password">Лозинка</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Најавување..." : "Најави се"}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <Link href="/register" className="text-primary hover:underline block">
              Немате профил? Регистрирајте се
            </Link>
            <Link href="/forgot-password" className="text-primary hover:underline block">
              Заборавена лозинка?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
