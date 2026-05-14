"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveSystemSettings(formData: FormData) {
  // Barcha kutilgan kalitlar ro'yxati (ayniqsa switch/checkboxlar uchun)
  const keys = ['tg_enabled', 'tg_token', 'tg_chat_id', 'gs_enabled', 'gs_id', 'cctv_url', 'cctv_protocol', 'work_start_time']
  
  for (const key of keys) {
    const value = formData.get(key)
    // Switchlar uchun: agar yoqilgan bo'lsa 'on', o'chirilgan bo'lsa null keladi
    const finalValue = (key.endsWith('_enabled')) 
      ? (value === 'on' ? 'on' : 'off')
      : (value as string || "")

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: finalValue },
      create: { key, value: finalValue }
    })
  }

  revalidatePath("/settings")
}
