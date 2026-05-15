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
      {/* @ts-ignore - Bypass type check for asChild prop which might be missing in some radix versions */}
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" /> {t('transfer') || "Ko'chirish"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{itemIds.length > 1 ? t('transferMultiple', { count: itemIds.length }) : t('transferTitle')}</DialogTitle>
          <DialogDescription>
            {t('transferDesc')}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomId">{t('newLocation')} <span className="text-red-500">*</span></Label>
            <Select name="roomId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectRoom')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {rooms.map(room => {
                  const roomLabel = `${room.floor?.building?.branch?.name} • ${room.floor?.building?.name} • ${room.floor?.number}-qavat • ${room.number}-xona ${room.faculty ? `(${room.faculty})` : ''}`.trim()
                  return (
                    <SelectItem key={room.id} value={room.id}>
                      {roomLabel}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId">{t('newResponsible')}</Label>
            <Select name="assignedToId">
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectResponsible')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="unassigned" className="italic text-muted-foreground">{t('nobody')}</SelectItem>
                {users.map(user => {
                  const userLabel = `${user.fullName} ${user.role ? `(${user.role.replace('_', ' ')})` : ''}`.trim()
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      {userLabel}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('noteLabel')}</Label>
            <Input id="note" name="note" placeholder={t('notePlaceholder')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {common("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? common("loading") : t("transfer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
