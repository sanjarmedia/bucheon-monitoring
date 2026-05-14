"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTranslations } from "next-intl"

interface LocationFormDialogProps {
  title: string
  triggerLabel: string
  triggerIcon?: React.ReactNode
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "xs" | "icon"
  className?: string
}

export function LocationFormDialog({
  title,
  triggerLabel,
  triggerIcon,
  action,
  children,
  variant = "outline",
  size = "sm",
  className
}: LocationFormDialogProps) {
  const common = useTranslations("Common")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData)
        setOpen(false)
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size={size} className={className} />}>
        <span className="flex items-center gap-1">
          {triggerIcon} {triggerLabel}
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {children}
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
