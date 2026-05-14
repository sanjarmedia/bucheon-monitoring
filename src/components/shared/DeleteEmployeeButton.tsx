"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteEmployee } from "@/lib/actions/user"
import { useTransition } from "react"

export function DeleteEmployeeButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm(`Haqiqatan ham xodim "${name}" ni o'chirmoqchimisiz?`)) {
      startTransition(async () => {
        try {
          await deleteEmployee(id)
          // Toast success if available
        } catch (error: any) {
          alert(error.message)
        }
      })
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-destructive hover:bg-destructive/10" 
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
