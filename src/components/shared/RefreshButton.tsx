"use client"

import { useState, useTransition } from "react"
import { useRouter } from "@/i18n/routing"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function RefreshButton({ className }: { className?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    startTransition(() => {
      router.refresh()
      // Give a little extra time for the animation to feel good
      setTimeout(() => setIsRefreshing(false), 800)
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      disabled={isPending || isRefreshing}
      className={cn("h-8 w-8 rounded-full hover:bg-primary/10", className)}
      title="Ma'lumotlarni yangilash"
    >
      <RefreshCw 
        className={cn(
          "h-4 w-4 transition-all duration-700",
          (isPending || isRefreshing) && "animate-spin text-primary"
        )} 
      />
    </Button>
  )
}
