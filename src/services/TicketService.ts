import { prisma } from "@/lib/prisma"
import { TelegramService } from "./TelegramService"

export class TicketService {
  /**
   * Creates a new support ticket and sends a Telegram notification.
   */
  static async createTicket(data: {
    category: string
    description: string
    createdById: string
    roomId?: string
    priority?: string
  }) {
    const ticket = await prisma.ticket.create({
      data: {
        category: data.category,
        description: data.description,
        createdById: data.createdById,
        roomId: data.roomId,
        priority: data.priority || "NORMAL",
      },
      include: {
        createdBy: true,
        room: {
          include: {
            floor: {
              include: { building: true }
            }
          }
        }
      }
    })

    // Send Telegram Notification
    const message = TelegramService.formatTicketMessage({
      id: ticket.id,
      category: ticket.category,
      description: ticket.description,
      roomName: ticket.room?.number,
      faculty: ticket.room?.faculty || undefined,
      creatorName: ticket.createdBy.fullName,
      priority: ticket.priority,
    })

    await TelegramService.sendMessage(message)

    return ticket
  }

  /**
   * Updates ticket status and logs history.
   */
  static async updateStatus(ticketId: string, status: string, performedById: string, resolutionComment?: string) {
    const oldTicket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        resolutionComment,
        updatedAt: new Date(),
      }
    })

    await prisma.ticketHistory.create({
      data: {
        ticketId,
        action: "STATUS_CHANGED",
        previousStatus: oldTicket?.status,
        newStatus: status,
        performedById,
      }
    })

    // Notify Telegram about closure
    if (status === "COMPLETED") {
      await TelegramService.sendMessage(`
<b>✅ Zayavka Yopildi! (Ticket Resolved)</b>
<b>ID:</b> ${ticketId}
<b>📝 Izoh:</b> ${TelegramService.escapeHtml(resolutionComment || 'Izohsiz yopildi')}
      `)
    }

    return ticket
  }

  /**
   * Get stats for dashboard monitoring.
   */
  static async getStats() {
    const total = await prisma.ticket.count()
    const open = await prisma.ticket.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } })
    const resolved = await prisma.ticket.count({ where: { status: "COMPLETED" } })

    // Group by faculty
    const byFaculty = await prisma.room.findMany({
      select: {
        faculty: true,
        _count: {
          select: { tickets: true }
        }
      }
    })

    return { total, open, resolved, byFaculty }
  }
}
