"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react"
import { updatePassword } from "@/lib/actions/user"
import { useTranslations } from "next-intl"

export function ChangePasswordForm() {
  const t = useTranslations("Profile")
  const common = useTranslations("Common")
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    const newPass = formData.get("newPassword") as string
    const confirmPass = formData.get("confirmPassword") as string

    if (newPass !== confirmPass) {
      setError(t('passwordMismatch') || "Parollar mos kelmadi")
      return
    }

    setError("")
    setSuccess(false)

    startTransition(async () => {
      try {
        const result = await updatePassword(formData)
        if (result?.error) {
          setError(result.error)
        } else {
          setSuccess(true)
          // Clear form logic can be here
        }
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm flex items-center gap-2 border border-red-100 animate-in fade-in zoom-in-95">
          <ShieldAlert className="h-4 w-4" /> {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2 border border-green-100 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="h-4 w-4" /> {t('passwordSuccess') || "Parol muvaffaqiyatli o'zgartirildi!"}
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" /> {t('currentPassword') || "Hozirgi parol"}
        </Label>
        <input type="hidden" name="dummy" value="1" /> {/* To avoid empty forms */}
        <Input name="currentPassword" type="password" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('newPassword') || "Yangi parol"}</Label>
          <Input name="newPassword" type="password" required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label>{t('confirmPassword') || "Tasdiqlang"}</Label>
          <Input name="confirmPassword" type="password" required minLength={6} />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-2 px-6">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {t('updatePassword') || "Parolni o'zgartirish"}
        </Button>
      </div>
    </form>
  )
}
