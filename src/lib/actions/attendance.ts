"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function manualCheckIn(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  const userId = formData.get("userId") as string
  const dateStr = formData.get("date") as string // YYYY-MM-DD
  const status = formData.get("status") as string
  const firstIn = formData.get("firstIn") as string // HH:mm
  
  if (!userId || !dateStr || !status) {
    throw new Error("Missing required fields")
  }

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  let firstInDate = null
  if (firstIn) {
    const [h, m] = firstIn.split(':').map(Number)
    firstInDate = new Date(date)
    firstInDate.setHours(h, m, 0, 0)
  }

  await prisma.dailyAttendance.upsert({
    where: {
      userId_date: {
        userId,
        date
      }
    },
    update: {
      status,
      firstIn: firstInDate
    },
    create: {
      userId,
      date,
      status,
      firstIn: firstInDate
    }
  })

  revalidatePath("/attendance")
}
