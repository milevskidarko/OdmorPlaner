"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { calculateDays } from "@/utils/calculateDays"
import { Textarea } from "@/components/ui/textarea"

interface RequestFormProps {
  userId: string
  vacationId?: string
  initialData?: {
    type: string
    date_from: string
    date_to: string
    comment: string | null
  }
}

export function RequestForm({ userId, vacationId, initialData }: RequestFormProps) {
  const [type, setType] = useState(initialData?.type || "годишен")
  const [dateFrom, setDateFrom] = useState(initialData?.date_from || "")
  const [dateTo, setDateTo] = useState(initialData?.date_to || "")
  const [comment, setComment] = useState(initialData?.comment || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const daysTotal = dateFrom && dateTo ? calculateDays(dateFrom, dateTo) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!dateFrom || !dateTo) {
      setError("Ве молиме внесете ги датумите")
      setLoading(false)
      return
    }

    if (daysTotal <= 0) {
      setError("Датумот 'До' мора да биде после датумот 'Од'")
      setLoading(false)
      return
    }

    try {
      // Check session before insert
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log("🔵 [RequestForm] Session check:", {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      })

      if (vacationId) {
        // Update existing vacation
        const { error } = await supabase
          .from("vacations")
          .update({
            type: type as "годишен" | "боледување" | "слободен ден",
            date_from: dateFrom,
            date_to: dateTo,
            days_total: daysTotal,
            comment: comment || null,
          })
          .eq("id", vacationId)

        if (error) throw error
      } else {
        // Create new vacation
        console.log("🔵 [RequestForm] Inserting vacation with userId:", userId)
        const { error } = await supabase
          .from("vacations")
          .insert({
            user_id: userId,
            type: type as "годишен" | "боледување" | "слободен ден",
            date_from: dateFrom,
            date_to: dateTo,
            days_total: daysTotal,
            comment: comment || null,
            status: "pending",
          })

        if (error) {
          console.error("❌ [RequestForm] Insert error:", error)
          throw error
        }
        console.log("✅ [RequestForm] Vacation inserted successfully")
      }

      // Force a full page reload to ensure data is refreshed
      window.location.href = "/dashboard/employee"
    } catch (error: any) {
      setError(error.message || "Грешка при поднесување на барањето")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Тип на одмор</Label>
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="годишен">Годишен одмор</option>
              <option value="боледување">Боледување</option>
              <option value="слободен ден">Слободен ден</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Од датум</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">До датум</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                required
                min={dateFrom}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Број денови</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-lg font-semibold">{daysTotal}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Коментар (опционално)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Додадете коментар ако е потребно..."
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Зачувување..." : vacationId ? "Зачувај промени" : "Поднеси барање"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Откажи
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
