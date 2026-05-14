"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Edit } from "lucide-react"
import { updateInventoryItem } from "@/lib/actions/inventory"
import { useTranslations } from "next-intl"

export function EditInventoryDialog({ item }: { item: any }) {
  const t = useTranslations("Inventory")
  const common = useTranslations("Common")
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    try {
      await updateInventoryItem(formData)
      setOpen(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Edit className="h-4 w-4" /> {t('editItem')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editItem')}</DialogTitle>
          <DialogDescription>
            {item.name} ma'lumotlarini tahrirlash
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" name="name" defaultValue={item.name} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryNumber">{t('inventoryNumber')}</Label>
              <Input id="inventoryNumber" name="inventoryNumber" defaultValue={item.inventoryNumber || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">{t('serialNumber')}</Label>
              <Input id="serialNumber" name="serialNumber" defaultValue={item.serialNumber || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{common('status')}</Label>
              <Select name="status" defaultValue={item.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="IN_REPAIR">IN REPAIR</SelectItem>
                  <SelectItem value="WRITTEN_OFF">WRITTEN OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">{t('costLabel')}</Label>
              <Input id="cost" name="cost" type="number" step="0.01" defaultValue={item.cost || 0} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? common('loading') : common('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
