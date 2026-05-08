"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loginAction } from "@/lib/actions/auth"
import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"

export default function LoginPage() {
  const t = useTranslations("Login")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        const result = await loginAction(formData)
        if (result?.error) {
          setError(result.error)
        }
      } catch (e) {
        // Redirects will be thrown here, Next.js handles them if it's a Server Action.
      }
    })
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-background">
      {/* Background with Blur and Logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Background Logo" className="w-[80vw] h-auto object-contain max-w-[800px]" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>
      
      {/* Decorative Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-sm px-4"
      >
        <Card className="mx-auto w-full shadow-2xl border-white/20 bg-card/80 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo" className="h-16 object-contain drop-shadow-md" onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x50/F39C12/FFFFFF.png?text=IMS+LOGO' }} />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-red-100/80 backdrop-blur-sm text-red-600 text-sm rounded-md border border-red-200/50"
                >
                  {t("error")}: {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" name="email" type="email" placeholder="admin@test.com" defaultValue="admin@test.com" required className="bg-background/50 border-white/10 focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input id="password" name="password" type="password" defaultValue="admin" required className="bg-background/50 border-white/10 focus-visible:ring-primary" />
              </div>
              <Button type="submit" className="w-full font-medium transition-all hover:scale-[1.02]" disabled={isPending}>
                {isPending ? "..." : t("submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
