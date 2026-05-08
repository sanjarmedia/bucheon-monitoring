"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function A11yControls() {
  const [fontSize, setFontSize] = useState<number>(16) // default 16px

  useEffect(() => {
    // Load saved font size on mount
    const saved = localStorage.getItem("a11y-font-size")
    if (saved) {
      const size = parseInt(saved, 10)
      setFontSize(size)
      document.documentElement.style.fontSize = `${size}px`
    }
  }, [])

  const changeFontSize = (delta: number) => {
    let newSize = fontSize + delta
    if (newSize < 12) newSize = 12
    if (newSize > 24) newSize = 24
    
    setFontSize(newSize)
    document.documentElement.style.fontSize = `${newSize}px`
    localStorage.setItem("a11y-font-size", newSize.toString())
  }

  const resetFontSize = () => {
    setFontSize(16)
    document.documentElement.style.fontSize = "16px"
    localStorage.setItem("a11y-font-size", "16")
  }

  return (
    <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-md border border-border/50">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 text-xs font-bold hover:bg-secondary hover:text-primary"
        onClick={() => changeFontSize(-2)}
        title="Matnni kichraytirish"
      >
        A-
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 text-sm font-bold hover:bg-secondary hover:text-primary"
        onClick={resetFontSize}
        title="Standart o'lcham"
      >
        A
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 text-base font-bold hover:bg-secondary hover:text-primary"
        onClick={() => changeFontSize(2)}
        title="Matnni kattalashtirish"
      >
        A+
      </Button>
    </div>
  )
}
