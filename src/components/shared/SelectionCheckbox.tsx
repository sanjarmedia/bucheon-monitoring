"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { useSelection } from "./SelectionContext"

export function SelectionCheckbox({ id }: { id: string }) {
  const { isSelected, toggleSelection } = useSelection()

  return (
    <Checkbox 
      checked={isSelected(id)} 
      onCheckedChange={() => toggleSelection(id)} 
      aria-label="Select item"
    />
  )
}

export function SelectAllCheckbox({ ids }: { ids: string[] }) {
  const { selectedIds, selectAll, clearSelection } = useSelection()
  
  const allSelected = ids.length > 0 && selectedIds.length === ids.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < ids.length

  return (
    <Checkbox 
      checked={allSelected ? true : someSelected ? "indeterminate" : false} 
      onCheckedChange={(checked) => {
        if (checked) {
          selectAll(ids)
        } else {
          clearSelection()
        }
      }} 
      aria-label="Select all"
    />
  )
}
