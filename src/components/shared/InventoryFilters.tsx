"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

export function InventoryFilters({ categories }: { categories: any[] }) {
  const t = useTranslations("Inventory")
  const common = useTranslations("Common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local states for inputs
  const [q, setQ] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "ALL")
  const [status, setStatus] = useState(searchParams.get("status") || "ALL")
  const [perPage, setPerPage] = useState(searchParams.get("perPage") || "25")

  function handleFilter() {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set("q", q)
      else params.delete("q")
      
      if (category !== "ALL") params.set("category", category)
      else params.delete("category")
      
      if (status !== "ALL") params.set("status", status)
      else params.delete("status")
      
      params.set("perPage", perPage)
      params.set("page", "1") // Reset to page 1 on filter

      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  function handleClear() {
    setQ("")
    setCategory("ALL")
    setStatus("ALL")
    startTransition(() => {
      router.push("?", { scroll: false })
    })
  }

  return (
    <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-xl border shadow-sm relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      <div className="space-y-2 flex-1 min-w-[200px]">
        <Label>{common('search')}</Label>
        <Input 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          placeholder={common('search')} 
        />
      </div>
      
      <div className="space-y-2 w-[200px]">
        <Label>{t('category')}</Label>
        <Select value={category} onValueChange={(v) => setCategory(v || "ALL")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('allCategories')}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 w-[150px]">
        <Label>{common('status')}</Label>
        <Select value={status} onValueChange={(v) => setStatus(v || "ALL")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('allStatus')}</SelectItem>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="IN_REPAIR">IN_REPAIR</SelectItem>
            <SelectItem value="WRITTEN_OFF">WRITTEN_OFF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 w-[100px]">
        <Label>Limit</Label>
        <Select value={perPage} onValueChange={(v) => setPerPage(v || "25")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleFilter} variant="secondary" className="gap-2">
          <Search className="h-4 w-4" /> {t('filterBtn')}
        </Button>
        <Button onClick={handleClear} variant="ghost">{t('clear')}</Button>
      </div>
    </div>
  )
}
