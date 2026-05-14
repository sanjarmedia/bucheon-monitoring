"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

export function InventoryPagination({ 
  total, 
  totalPages, 
  currentPage, 
  perPage 
}: { 
  total: number, 
  totalPages: number, 
  currentPage: number, 
  perPage: number 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function goToPage(page: number) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", String(page))
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push("...")
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/30 dark:bg-black/10 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Showing <b>{(currentPage - 1) * perPage + 1}</b> to <b>{Math.min(currentPage * perPage, total)}</b> of <b>{total}</b> items
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) => (
          p === "..." ? (
            <span key={i} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={i}
              variant={p === currentPage ? "default" : "outline"}
              size="icon-sm"
              onClick={() => goToPage(p as number)}
              disabled={isPending}
              className="w-8 h-8"
            >
              {p}
            </Button>
          )
        ))}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
