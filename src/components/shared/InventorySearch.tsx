"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, X, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InventoryItem {
  id: string
  name: string
  inventoryNumber: string | null
  serialNumber: string | null
  status: string
}

export function InventorySearch({ onSelect }: { onSelect: (items: InventoryItem[]) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<InventoryItem[]>([])
  const [selected, setSelected] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const toggleSelect = (item: InventoryItem) => {
    const isSelected = selected.some(s => s.id === item.id)
    let newSelected
    if (isSelected) {
      newSelected = selected.filter(s => s.id !== item.id)
    } else {
      newSelected = [...selected, item]
    }
    setSelected(newSelected)
    onSelect(newSelected)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Jihoz nomi, INV yoki SN bo'yicha qidirish..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] animate-pulse">Qidirilmoqda...</div>}
      </div>

      {results.length > 0 && (
        <div className="border rounded-lg max-h-[200px] overflow-y-auto bg-card shadow-sm">
          {results.map(item => (
            <div
              key={item.id}
              onClick={() => toggleSelect(item)}
              className={`flex items-center justify-between p-3 border-b last:border-0 cursor-pointer hover:bg-secondary/50 transition-colors ${
                selected.some(s => s.id === item.id) ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {item.inventoryNumber ? `INV: ${item.inventoryNumber}` : item.serialNumber ? `SN: ${item.serialNumber}` : "ID yo'q"}
                  </p>
                </div>
              </div>
              {selected.some(s => s.id === item.id) ? (
                <Badge className="bg-primary text-white">Tanlangan</Badge>
              ) : (
                <Plus className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selected.map(item => (
            <Badge key={item.id} variant="secondary" className="flex items-center gap-1 py-1 px-2">
              <span className="max-w-[150px] truncate">{item.name}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelect(item)
                }} 
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
