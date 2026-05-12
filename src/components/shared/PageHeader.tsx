"use client"
import React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "@/i18n/routing"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  showBackButton?: boolean
}

import { RefreshButton } from "./RefreshButton"

export function PageHeader({ title, description, children, className, showBackButton }: PageHeaderProps) {
  const router = useRouter()
  
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div className="flex items-start gap-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <RefreshButton />
          </div>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
