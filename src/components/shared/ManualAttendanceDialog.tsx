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
import { CalendarClock, Plus } from "lucide-react"
import { manualCheckIn } from "@/lib/actions/attendance"
import { useTranslations } from "next-intl"

export function ManualAttendanceDialog({ users }: { users: any[] }) {
  const t = useTranslations("Attendance")
  const common = useTranslations("Common")
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    try {
      await manualCheckIn(formData)
      setOpen(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarClock className="h-4 w-4" /> {t('manualCheckIn') || "Qo'lda kiritish"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('manualCheckIn') || "Davomatni qo'lda kiritish"}</DialogTitle>
          <DialogDescription>
            Xodim uchun davomat yozuvini yarating yoki tahrirlang.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('employee')}</Label>
            <Select name="userId" required>
              <SelectTrigger>
                <SelectValue placeholder="Xodimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sana</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="PRESENT">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">PRESENT</SelectItem>
                  <SelectItem value="LATE">LATE</SelectItem>
                  <SelectItem value="ABSENT">ABSENT</SelectItem>
                  <SelectItem value="SICK">SICK</SelectItem>
                  <SelectItem value="VACATION">VACATION</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kelgan vaqti (HH:mm)</Label>
            <Input name="firstIn" type="time" placeholder="09:00" />
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
