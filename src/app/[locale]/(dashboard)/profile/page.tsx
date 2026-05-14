import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image as ImageIcon, User, Mail, Shield, Save } from "lucide-react"
import { ProfileForm } from "@/components/shared/ProfileForm"
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm"

import { auth } from "@/auth"

export default async function ProfilePage() {
  const t = await getTranslations("Employees")
  const common = await getTranslations("Common")
  const inv = await getTranslations("Inventory")

  const session = await auth()
  if (!session?.user?.id) return <div>Unauthorized</div>

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) return <div>User not found</div>

  return (
    <div className="space-y-6">
      <PageHeader 
        title={user.fullName} 
        description="Shaxsiy profilingiz va ma'lumotlaringiz"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profil surati</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative group">
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName} 
                  className="w-48 h-48 rounded-full object-cover border-4 border-background shadow-xl" 
                />
              ) : (
                <div className="w-48 h-48 bg-secondary rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                  <User className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl">{user.fullName}</h3>
              <p className="text-muted-foreground">{user.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
            <CardDescription>Ma'lumotlaringizni tahrirlang va saqlang</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <div className="md:col-start-2 md:col-span-2">
          <Card className="border-red-100 bg-red-50/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" /> Xavfsizlik
              </CardTitle>
              <CardDescription>Profil parolini o'zgartirish</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
