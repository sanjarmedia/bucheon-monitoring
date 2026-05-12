"use client"

import { useState, useEffect } from "react"
import { useConfirmLeave } from "@/hooks/useConfirmLeave"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, User, Mail, Shield, Image as ImageIcon } from "lucide-react"
import { updateProfile } from "@/lib/actions/user"
import { useTranslations } from "next-intl"

export function ProfileForm({ user }: { user: any }) {
  const common = useTranslations("Common")
  const t = useTranslations("Profile")
  const [isDirty, setIsDirty] = useState(false)
  
  // Hook to warn about unsaved changes
  useConfirmLeave(isDirty, t('confirmLeave'))

  const handleChange = () => setIsDirty(true)

  return (
    <form 
      action={async (formData) => {
        await updateProfile(formData)
        setIsDirty(false)
      }} 
      onChange={handleChange}
      className="space-y-6"
    >
      <input type="hidden" name="id" value={user.id} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t('fullName')}
          </Label>
          <Input name="fullName" defaultValue={user.fullName} required />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> {t('email')}
          </Label>
          <Input name="email" type="email" defaultValue={user.email} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4" /> {t('role')}
        </Label>
        <Input defaultValue={user.role} disabled className="bg-muted" />
        <p className="text-[10px] text-muted-foreground">{t('roleNotice')}</p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> {t('newPhoto')}
        </Label>
        <Input name="image" type="file" accept="image/*" />
      </div>

      <div className="pt-4 border-t flex justify-end items-center gap-4">
        {isDirty && (
          <span className="text-xs text-orange-500 animate-pulse font-medium">
            {t('unsaved')}
          </span>
        )}
        <Button type="submit" className="gap-2 px-8">
          <Save className="h-4 w-4" /> {common('save')}
        </Button>
      </div>
    </form>
  )
}
