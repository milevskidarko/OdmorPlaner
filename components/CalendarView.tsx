"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { generateMonthlyReport } from "@/utils/pdfHelpers"

interface CalendarViewProps {
  isAdmin: boolean
}

export function CalendarView({ isAdmin }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [vacations, setVacations] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const fetchVacations = async () => {
    setLoading(true)
    try {
      // Get current user for employee view
      let currentUserId: string | null = null
      if (!isAdmin) {
        const { data: { user } } = await supabase.auth.getUser()
        currentUserId = user?.id || null
      }

      let query = supabase
        .from("vacations")
        .select("*, profiles(full_name, email)")
        .eq("status", "approved")
        .gte("date_from", monthStart.toISOString().split("T")[0])
        .lte("date_to", monthEnd.toISOString().split("T")[0])

      // For employees: only show their own approved vacations
      // For admins: filter by selectedEmployee if not "all"
      if (!isAdmin && currentUserId) {
        query = query.eq("user_id", currentUserId)
      } else if (isAdmin && selectedEmployee !== "all") {
        query = query.eq("user_id", selectedEmployee)
      }

      // Filter by type if selected
      if (isAdmin && selectedType !== "all") {
        query = query.eq("type", selectedType)
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

  const fetchEmployees = async () => {
    if (!isAdmin) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "employee")
        .order("full_name")

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  useEffect(() => {
    fetchVacations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, selectedEmployee, selectedType])

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const getVacationsForDay = (day: Date) => {
    return vacations.filter((vacation) => {
      const from = new Date(vacation.date_from)
      const to = new Date(vacation.date_to)
      return day >= from && day <= to
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "годишен":
        return "bg-blue-500"
      case "боледување":
        return "bg-orange-500"
      default:
        return "bg-purple-500"
    }
  }

  const handleExportPDF = () => {
    const reportData = vacations.map((v) => ({
      employeeName: v.profiles?.full_name || v.profiles?.email || "Непознат",
      dateFrom: v.date_from,
      dateTo: v.date_to,
      type: v.type,
      days: v.days_total,
      status: v.status,
    }))

    const monthName = format(currentDate, "MMMM")
    const year = currentDate.getFullYear()
    generateMonthlyReport(reportData, monthName, year)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {isAdmin && (
              <>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full md:w-48"
                >
                  <option value="all">Сите вработени</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.email}
                    </option>
                  ))}
                </Select>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full md:w-48"
                >
                  <option value="all">Сите типови</option>
                  <option value="годишен">Годишен одмор</option>
                  <option value="боледување">Боледување</option>
                  <option value="слободен ден">Слободен ден</option>
                </Select>
                <Button onClick={handleExportPDF} variant="outline" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {["Пон", "Вто", "Сре", "Чет", "Пет", "Саб", "Нед"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                {day}
              </div>
            ))}
            {daysInMonth.map((day, index) => {
              const dayVacations = getVacationsForDay(day)
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={index}
                  className={`min-h-[100px] border rounded-lg p-2 ${
                    isToday ? "bg-blue-50 border-blue-300" : "bg-white"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayVacations.slice(0, 3).map((vacation) => (
                      <div
                        key={vacation.id}
                        className={`text-xs p-1 rounded ${getTypeColor(vacation.type)} text-white truncate`}
                        title={`${vacation.profiles?.full_name || vacation.profiles?.email}: ${vacation.type}`}
                      >
                        {vacation.profiles?.full_name || vacation.profiles?.email}
                      </div>
                    ))}
                    {dayVacations.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayVacations.length - 3} повеќе
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Годишен одмор</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Боледување</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span>Слободен ден</span>
        </div>
      </div>
    </div>
  )
}
