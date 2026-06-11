"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
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
import { Plus, UserPlus, Image as ImageIcon } from "lucide-react"
import { createEmployee } from "@/lib/actions/user"
import { useTranslations } from "next-intl"

export function CreateEmployeeButton() {
  const t = useTranslations("Employees")
  const common = useTranslations("Common")
  const inv = useTranslations("Inventory")
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <UserPlus className="h-4 w-4" /> {t('addEmployee')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addEmployee')}</DialogTitle>
          <DialogDescription>
            {t('addSubtitle')}
          </DialogDescription>
        </DialogHeader>
        <form action={async (formData) => {
          const imageFile = formData.get("image") as File | null
          if (imageFile && imageFile.size > 4 * 1024 * 1024) {
            alert("Rasm hajmi juda katta (maksimal 4MB). Iltimos, kichikroq rasm tanlang.")
            return
          }
          await createEmployee(formData)
          setOpen(false)
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{inv('name')}</Label>
            <Input id="fullName" name="fullName" placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" name="password" type="password" minLength={6} placeholder="******" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{t('role')}</Label>
            <Select name="role" defaultValue="EMPLOYEE">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">{inv('itemPhoto')}</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>
          <DialogFooter>
            <SubmitButton label={common('save')} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "..." : label}
    </Button>
  )
}
