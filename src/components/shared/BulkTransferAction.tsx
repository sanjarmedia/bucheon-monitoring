"use client"

import { useSelection } from "./SelectionContext"
import { TransferInventoryDialog } from "./TransferInventoryDialog"
import { Button } from "@/components/ui/button"
import { X, CheckSquare } from "lucide-react"

export function BulkTransferAction({ rooms, users }: { rooms: any[], users: any[] }) {
  const { selectedIds, clearSelection } = useSelection()

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-50">
      <div className="flex items-center gap-2 font-medium">
        <CheckSquare className="h-5 w-5 opacity-80" />
        <span>{selectedIds.length} ta jihoz tanlandi</span>
      </div>
      
      <div className="flex items-center gap-2">
        <TransferInventoryDialog 
          itemIds={selectedIds} 
          rooms={rooms} 
          users={users} 
          onSuccess={clearSelection}
          triggerButton={
            <Button variant="secondary" size="sm" className="font-bold">
              Ko'chirish
            </Button>
          }
        />
        
        <Button variant="ghost" size="icon" onClick={clearSelection} className="rounded-full hover:bg-primary-foreground/20 hover:text-primary-foreground text-primary-foreground/70">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
