"use client"

import { useEffect } from "react"

export function useConfirmLeave(isDirty: boolean, message = "Sizda saqlanmagan o'zgarishlar bor. Haqiqatan ham tark etmoqchimisiz?") {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty, message])
}
