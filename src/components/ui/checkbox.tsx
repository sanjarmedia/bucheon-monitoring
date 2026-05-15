"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked'> {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null)
    const combinedRef = (node: HTMLInputElement) => {
      internalRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = checked === "indeterminate"
      }
    }, [checked])

    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          ref={combinedRef}
          checked={checked === true}
          onChange={(e) => {
            if (onChange) onChange(e)
            if (onCheckedChange) onCheckedChange(e.target.checked)
          }}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-transparent checked:bg-primary checked:border-primary transition-colors cursor-pointer",
            className
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
