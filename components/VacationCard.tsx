"use client"

import { formatDateRange } from "@/utils/formatDates"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ConfirmDialog"

interface VacationCardProps {
  vacation: {
    id: string
    type: string
    date_from: string
    date_to: string
    days_total: number
    comment: string | null
    status: string
    user_id?: string
    profiles?: {
      full_name: string | null
      email: string
    }
  }
  showActions?: boolean
  onUpdate?: () => void
}

export function VacationCard({ vacation, showActions = true, onUpdate }: VacationCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Одобрено"
      case "rejected":
        return "Одбиено"
      default:
        return "Во тек"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "годишен":
        return "bg-blue-100 text-blue-800"
      case "боледување":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("vacations")
        .update({ status: "approved" })
        .eq("id", vacation.id)

      if (error) {
        console.error("Error approving vacation:", error)
        alert(`Грешка при одобрување: ${error.message}`)
        return
      }
      
      onUpdate?.()
    } catch (error: any) {
      console.error("Error approving vacation:", error)
      alert(`Грешка: ${error.message || "Неочекувана грешка"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("vacations")
        .update({ status: "rejected" })
        .eq("id", vacation.id)

      if (error) {
        console.error("Error rejecting vacation:", error)
        alert(`Грешка при одбивање: ${error.message}`)
        return
      }
      
      onUpdate?.()
    } catch (error: any) {
      console.error("Error rejecting vacation:", error)
      alert(`Грешка: ${error.message || "Неочекувана грешка"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("vacations")
        .delete()
        .eq("id", vacation.id)

      if (error) throw error
      onUpdate?.()
    } catch (error) {
      console.error("Error deleting vacation:", error)
      alert("Грешка при бришење на барање")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/employee/new-request?edit=${vacation.id}`)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {vacation.profiles && (
              <div className="mb-2">
                <h3 className="text-lg font-semibold">
                  {vacation.profiles.full_name || vacation.profiles.email}
                </h3>
                <p className="text-xs text-gray-500">
                  {vacation.profiles.email}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Период:</span>
                <span className="font-medium">{formatDateRange(vacation.date_from, vacation.date_to)}</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={getTypeColor(vacation.type)}>
                  {vacation.type}
                </Badge>
                <Badge className={getStatusColor(vacation.status)}>
                  {getStatusLabel(vacation.status)}
                </Badge>
                <span className="text-sm text-gray-600">
                  {vacation.days_total} {vacation.days_total === 1 ? "ден" : "денови"}
                </span>
              </div>
              {vacation.comment && (
                <p className="text-sm text-gray-600 mt-2">{vacation.comment}</p>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2">
              {vacation.status === "pending" && (
                <>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setConfirmApprove(true)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Одобри
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setConfirmReject(true)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Одбиј
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEdit}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Уреди
                  </Button>
                </>
              )}
              {vacation.status !== "pending" && (
                <div className="text-xs text-gray-500">
                  {vacation.status === "approved" ? "✓ Одобрено" : "✗ Одбиено"}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Избриши
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        onConfirm={handleApprove}
        title="Одобри барање"
        description="Дали сте сигурни дека сакате да го одобрите ова барање за одмор?"
        confirmText="Одобри"
        variant="default"
      />
      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        onConfirm={handleReject}
        title="Одбиј барање"
        description="Дали сте сигурни дека сакате да го одбиете ова барање за одмор?"
        confirmText="Одбиј"
        variant="destructive"
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDelete}
        title="Избриши барање"
        description="Дали сте сигурни дека сакате да го избришете ова барање? Оваа акција не може да се врати."
        confirmText="Избриши"
        variant="destructive"
      />
    </Card>
  )
}
