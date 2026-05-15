"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
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
import { Upload } from "lucide-react"
import { importInventoryExcel } from "@/lib/actions/excel"
import { useTranslations } from "next-intl"

export function ImportInventoryDialog() {
  const t = useTranslations("Inventory")
  const common = useTranslations("Common")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    const file = formData.get("file") as File | null
    if (file && file.size > 5 * 1024 * 1024) {
      alert("Excel fayl hajmi juda katta (maksimal 5MB). Iltimos, ma'lumotlarni qismlarga bo'lib yuklang.")
      return
    }

    startTransition(async () => {
      try {
        await importInventoryExcel(formData)
        setOpen(false)
      } catch (error: any) {
        alert(error.message || "Faylni yuklashda xatolik yuz berdi")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" />}>
        <Upload className="h-4 w-4" /> {t("sync")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('importTitle')}</DialogTitle>
          <DialogDescription>
            {t('importDesc')}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input type="file" name="file" accept=".xlsx,.xls" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? common("loading") : t('importBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
