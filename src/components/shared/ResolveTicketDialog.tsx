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
import { resolveTicket } from "@/lib/actions/tickets"
import { useTranslations } from "next-intl"

export function ResolveTicketDialog({ ticketId, ticketName }: { ticketId: string, ticketName: string }) {
  const t = useTranslations("Tickets")
  const common = useTranslations("Common")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await resolveTicket(formData)
        setOpen(false)
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="text-xs hover:bg-green-50 hover:text-green-600 transition-colors">{t('close')}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('completeTicket')}</DialogTitle>
          <DialogDescription>
             #{ticketId.slice(-8)} - {ticketName} uchun yechim kiritish
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="ticketId" value={ticketId} />
          <div className="space-y-2">
            <Label>{t('resolutionComment')}</Label>
            <Input 
              name="resolutionComment" 
              placeholder={t('resolutionComment') || "Nima ish qilindi?"} 
              required 
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? common('loading') : t('closeTelegram')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
