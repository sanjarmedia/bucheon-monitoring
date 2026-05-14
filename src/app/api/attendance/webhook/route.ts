import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, turnstileId } = body

    if (!userId || !turnstileId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const turnstile = await prisma.turnstile.findUnique({ where: { id: turnstileId } })
    if (!turnstile) {
      return NextResponse.json({ error: "Invalid turnstile ID" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 404 })
    }

    const now = new Date()
    
    // Create the raw log
    await prisma.attendanceLog.create({
      data: {
        userId,
        turnstileId,
        type: turnstile.type,
        timestamp: now
      }
    })

    // Process Daily Attendance
    // Normalize date to start of day in UTC (or local timezone if strictly configured)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let daily = await prisma.dailyAttendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    })

    if (turnstile.type === 'IN') {
      if (!daily) {
        // Fetch work start time from settings
        const startTimeSetting = await prisma.systemSetting.findUnique({ where: { key: 'work_start_time' } })
        const startTimeStr = startTimeSetting?.value || "09:00"
        const [startHour, startMin] = startTimeStr.split(':').map(Number)
        
        // Create a comparison date for today at start time
        const workStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin)
        
        const isLate = now.getTime() > workStartTime.getTime()

        // First IN of the day
        daily = await prisma.dailyAttendance.create({
          data: {
            userId,
            date: today,
            firstIn: now,
            status: isLate ? "LATE" : "PRESENT"
          }
        })
      }
    } else if (turnstile.type === 'OUT') {
      if (!daily) {
        // Out without IN (maybe missed the punch)
        daily = await prisma.dailyAttendance.create({
          data: {
            userId,
            date: today,
            lastOut: now,
            status: "PRESENT"
          }
        })
      } else {
        // We have a daily record, let's update lastOut and add to totalWorkMinutes
        // Find the last 'IN' log for today
        const lastInLog = await prisma.attendanceLog.findFirst({
          where: {
            userId,
            type: 'IN',
            timestamp: {
              gte: today
            }
          },
          orderBy: { timestamp: 'desc' }
        })

        let minutesToAdd = 0
        if (lastInLog) {
          const diffMs = now.getTime() - lastInLog.timestamp.getTime()
          minutesToAdd = Math.floor(diffMs / 60000)
          
          // Avoid double counting if there was already an OUT after this IN
          const outAfterLastIn = await prisma.attendanceLog.findFirst({
            where: {
              userId,
              type: 'OUT',
              timestamp: {
                gt: lastInLog.timestamp,
                lt: now
              }
            }
          })

          if (outAfterLastIn) {
             minutesToAdd = 0 // Already counted
          }
        }

        daily = await prisma.dailyAttendance.update({
          where: { id: daily.id },
          data: {
            lastOut: now,
            totalWorkMinutes: {
              increment: minutesToAdd > 0 ? minutesToAdd : 0
            }
          }
        })
      }
    }

    return NextResponse.json({ success: true, daily })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
