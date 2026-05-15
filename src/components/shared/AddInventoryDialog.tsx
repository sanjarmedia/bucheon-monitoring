"use client"

import { useState, useTransition } from "react"
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
import { Plus } from "lucide-react"
import { createInventoryItem } from "@/lib/actions/inventory"
import { useTranslations } from "next-intl"

export function AddInventoryDialog({ categories }: { categories: any[] }) {
  const t = useTranslations("Inventory")
  const common = useTranslations("Common")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    const imageFile = formData.get("image") as File | null
    if (imageFile && imageFile.size > 4 * 1024 * 1024) {
      alert("Rasm hajmi juda katta (maksimal 4MB). Iltimos, kichikroq rasm tanlang.")
      return
    }

    startTransition(async () => {
      const result = await createInventoryItem(formData)
      if (result?.error) {
        alert(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" /> {t("addItem")}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addItem')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" name="name" placeholder={t('name')} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">{t('category')}</Label>
              <Select name="categoryId" required>
                <SelectTrigger>
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{common('status')}</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="IN_REPAIR">IN_REPAIR</SelectItem>
                  <SelectItem value="WRITTEN_OFF">WRITTEN_OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">{t('itemImage')}</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventoryNumber">{t('inventoryNumber')}</Label>
            <Input id="inventoryNumber" name="inventoryNumber" placeholder="INV-XXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serialNumber">{t('serialNumber')}</Label>
            <Input id="serialNumber" name="serialNumber" placeholder="SN-XXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">{t('costLabel')}</Label>
            <Input id="cost" name="cost" type="number" step="0.01" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? common("loading") : t('saveItem')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
