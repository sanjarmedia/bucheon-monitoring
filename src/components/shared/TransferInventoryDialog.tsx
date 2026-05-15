"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRightLeft } from "lucide-react"
import { transferInventoryItem, bulkTransferInventoryItems } from "@/lib/actions/transfer"
import { useTranslations } from "next-intl"

export function TransferInventoryDialog({ 
  itemIds, 
  rooms, 
  users, 
  triggerButton,
  onSuccess
}: { 
  itemIds: string[]
  rooms: any[]
  users: any[]
  triggerButton?: React.ReactNode
  onSuccess?: () => void
}) {
  const common = useTranslations("Common")
  const t = useTranslations("Inventory")
  
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    const roomId = formData.get("roomId") as string
    const assignedToId = formData.get("assignedToId") as string
    const note = formData.get("note") as string

    if (!roomId) {
      alert("Iltimos, yangi joylashuvni tanlang")
      return
    }

    startTransition(async () => {
      let result;
      if (itemIds.length === 1) {
        // Add itemId to formData for single transfer
        formData.append("itemId", itemIds[0])
        result = await transferInventoryItem(formData)
      } else {
        // Bulk transfer
        result = await bulkTransferInventoryItems(itemIds, roomId, assignedToId || null, note)
      }

      if (result?.error) {
        alert(result.error)
      } else {
        setOpen(false)
        if (onSuccess) onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" /> {t('transfer') || "Ko'chirish"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{itemIds.length > 1 ? `Bir nechta jihozlarni ko'chirish (${itemIds.length})` : "Jihozni boshqa joyga o'tkazish"}</DialogTitle>
          <DialogDescription>
            Jihoz uchun yangi xona va javobgar shaxsni belgilang.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomId">Yangi joylashuv (Xona) <span className="text-red-500">*</span></Label>
            <Select name="roomId" required>
              <SelectTrigger>
                <SelectValue placeholder="Xonani tanlang..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.floor?.building?.branch?.name} • {room.floor?.building?.name} • {room.floor?.number}-qavat • {room.number}-xona {room.faculty ? `(${room.faculty})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId">Yangi mas'ul shaxs (Ixtiyoriy)</Label>
            <Select name="assignedToId">
              <SelectTrigger>
                <SelectValue placeholder="Mas'ul shaxsni tanlang..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="unassigned" className="italic text-muted-foreground">-- Hech kim --</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} ({user.role?.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Izoh (Ixtiyoriy)</Label>
            <Input id="note" name="note" placeholder="Masalan: Litsey ehtiyoji uchun o'tkazildi" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? common("loading") : "Ko'chirish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
