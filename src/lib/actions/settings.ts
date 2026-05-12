"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveSystemSettings(formData: FormData) {
  const entries = Array.from(formData.entries())
  
  for (const [key, value] of entries) {
    if (typeof value === 'string' && !key.startsWith('$')) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }
  }

  revalidatePath("/settings")
}
