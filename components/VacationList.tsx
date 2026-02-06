"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { VacationCard } from "@/components/VacationCard"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VacationList() {
  const [vacations, setVacations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const supabase = createClient()

  const fetchVacations = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("vacations")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setVacations(data || [])
    } catch (error) {
      console.error("Error fetching vacations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVacations()
  }, [statusFilter])

  if (loading) {
    return <div className="text-center py-8">Вчитување...</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="status">Филтер по статус</Label>
            <Select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Сите</option>
              <option value="pending">Во тек</option>
              <option value="approved">Одобрени</option>
              <option value="rejected">Одбиени</option>
            </Select>
          </div>
        </div>
      </div>

      {vacations.length > 0 ? (
        vacations.map((vacation) => (
          <VacationCard
            key={vacation.id}
            vacation={vacation}
            showActions={true}
            onUpdate={fetchVacations}
          />
        ))
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Нема барања
        </div>
      )}
    </div>
  )
}
