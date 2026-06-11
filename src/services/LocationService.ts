import { prisma } from "@/lib/prisma"

/**
 * LocationService
 * Encapsulates all business logic for Buildings, Floors, and Rooms.
 */
export class LocationService {
  /**
   * Retrieves all branches with their nested buildings, floors, and rooms.
   */
  static async getFullLocationTree() {
    // Yengil daraxt: xonalar bo'yicha faqat hisoblagichlar (5000+ inventar qatorini tortmaydi)
    return await prisma.branch.findMany({
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                rooms: {
                  select: {
                    id: true,
                    number: true,
                    faculty: true,
                    _count: {
                      select: { inventory: true, tickets: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  /**
   * Header dropdown uchun faqat filial nomlari (juda yengil).
   */
  static async getBranchList() {
    return await prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  }

  /**
   * Retrieves a single room by ID, including its nested inventory and ticket history.
   */
  static async getRoomDetails(roomId: string) {
    return await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        floor: {
          include: { building: { include: { branch: true } } }
        },
        responsible: true,
        inventory: {
          include: { category: true }
        },
        tickets: {
          include: { createdBy: true, assignedTo: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
  }

  /**
   * Updates room metadata (faculty, responsible person) and logs history.
   */
  static async updateRoomMetadata(roomId: string, data: { faculty?: string | null, responsibleId?: string | null, responsibleSince?: Date | null }) {
    const oldRoom = await prisma.room.findUnique({ where: { id: roomId }, include: { responsible: true } })
    
    const room = await prisma.room.update({
      where: { id: roomId },
      data,
      include: { responsible: true }
    })

    // Log changes
    if (data.faculty !== undefined && data.faculty !== oldRoom?.faculty) {
      await prisma.roomHistory.create({
        data: {
          roomId,
          action: "FACULTY_CHANGED",
          description: `Bo'lim o'zgardi: "${oldRoom?.faculty || "Bo'sh"}" -> "${data.faculty || "Bo'sh"}"`
        }
      })
    }

    if (data.responsibleId !== undefined && data.responsibleId !== oldRoom?.responsibleId) {
      await prisma.roomHistory.create({
        data: {
          roomId,
          action: "RESPONSIBLE_CHANGED",
          description: `Javobgar o'zgardi: "${oldRoom?.responsible?.fullName || "Hech kim"}" -> "${room.responsible?.fullName || "Hech kim"}"`
        }
      })
    }

    return room
  }

  /**
   * Transfers inventory items to a specific room.
   */
  static async transferInventoryToRoom(roomId: string, inventoryIds: string[], performedBy?: string) {
    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryIds } }
    })

    await prisma.inventoryItem.updateMany({
      where: { id: { in: inventoryIds } },
      data: { roomId }
    })

    for (const item of items) {
      await prisma.roomHistory.create({
        data: {
          roomId,
          action: "INVENTORY_ADDED",
          description: `Jihoz qo'shildi: ${item.name} (${item.inventoryNumber || item.serialNumber || 'No ID'})`,
          performedBy
        }
      })
    }
  }
}
