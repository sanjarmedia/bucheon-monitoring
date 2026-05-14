"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"

export function RequestFilters() {
  const t = useTranslations("Tickets")
  const common = useTranslations("Common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get("q") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "ALL")
  const [priority, setPriority] = useState(searchParams.get("priority") || "ALL")

  function handleFilter() {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set("q", q)
      else params.delete("q")
      
      if (status !== "ALL") params.set("status", status)
      else params.delete("status")
      
      if (priority !== "ALL") params.set("priority", priority)
      else params.delete("priority")
      
      params.set("page", "1")
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  function handleClear() {
    setQ("")
    setStatus("ALL")
    setPriority("ALL")
    startTransition(() => {
      router.push("?", { scroll: false })
    })
  }

  return (
    <Card className="border-none shadow-lg bg-white/50 backdrop-blur-md mb-6 relative overflow-hidden">
      {isPending && (
        <div className="absolute inset-0 bg-white/30 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[240px] space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{common('search')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9 bg-white"
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                placeholder={t('searchPlaceholder') || "Search tickets..."} 
              />
            </div>
          </div>

          <div className="w-[180px] space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('allStatus') || "All Status"}</SelectItem>
                <SelectItem value="NEW">NEW</SelectItem>
                <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px] space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('priority')}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('allPriority') || "All Priority"}</SelectItem>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="NORMAL">NORMAL</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="URGENT">URGENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFilter} className="gap-2 px-6 shadow-md">
               {t('filterBtn') || "Filter"}
            </Button>
            <Button onClick={handleClear} variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent } from "@/components/ui/card"
