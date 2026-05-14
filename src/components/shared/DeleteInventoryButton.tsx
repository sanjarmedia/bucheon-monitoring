"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteInventoryItem } from "@/lib/actions/inventory"
import { useTransition } from "react"
import { useRouter } from "@/i18n/routing"

export function DeleteInventoryButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (confirm(`Haqiqatan ham "${name}" ni butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) {
      startTransition(async () => {
        const result = await deleteInventoryItem(id)
        if (result?.error) {
          alert(result.error)
        } else {
          router.push("/inventory")
        }
      })
    }
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="text-destructive border-destructive/20 hover:bg-destructive/10" 
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
