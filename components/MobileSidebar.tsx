"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/Sidebar"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface MobileSidebarProps {
  role: "admin" | "employee"
}

export function MobileSidebar({ role }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[280px] p-0 h-full max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Мени</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div onClick={() => setOpen(false)}>
            <Sidebar role={role} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
