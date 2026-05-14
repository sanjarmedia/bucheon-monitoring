import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

/**
 * InventoryService
 * Encapsulates all business logic and database interactions for Inventory Items.
 */
export class InventoryService {
  /**
   * Retrieves all inventory items with their relationships, filtered by optional parameters.
   */
  static async getItems(filters: {
    q?: string
    category?: string
    status?: string
    branchId?: string
    faculty?: string
    page?: number
    perPage?: number
  } = {}) {
    const whereClause: Prisma.InventoryItemWhereInput = {}
    const page = filters.page ?? 1
    const perPage = filters.perPage ?? 25
    const skip = (page - 1) * perPage

    if (filters.q) {
      whereClause.OR = [
        { name: { contains: filters.q } },
        { inventoryNumber: { contains: filters.q } },
        { serialNumber: { contains: filters.q } },
      ]
    }

    if (filters.category && filters.category !== "ALL") {
      whereClause.categoryId = filters.category
    }

    if (filters.status && filters.status !== "ALL") {
      whereClause.status = filters.status
    }

    if (filters.branchId && filters.branchId !== "ALL") {
      whereClause.room = {
        floor: {
          building: {
            branchId: filters.branchId
          }
        }
      }
    }

    if (filters.faculty && filters.faculty !== "ALL") {
      whereClause.room = {
        ...((whereClause.room as any) || {}),
        faculty: filters.faculty
      }
    }

    const [items, total] = await prisma.$transaction([
      prisma.inventoryItem.findMany({
        where: whereClause,
        include: {
          category: true,
          room: {
            include: {
              floor: {
                include: { building: true }
              }
            }
          },
          assignedTo: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.inventoryItem.count({ where: whereClause })
    ])

    return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) }
  }

  /**
   * Retrieves a single inventory item by ID, including its complete lifecycle history.
   */
  static async getItemById(id: string) {
    return await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        room: {
          include: { floor: { include: { building: { include: { branch: true } } } } }
        },
        assignedTo: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  /**
   * Creates a new inventory item and logs its creation in the history.
   */
  static async createItem(data: {
    name: string
    categoryId: string
    inventoryNumber?: string | null
    serialNumber?: string | null
    cost?: number | null
    imageUrl?: string | null
    status?: string
    userId: string // Who performed the creation
  }) {
    return await prisma.inventoryItem.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        inventoryNumber: data.inventoryNumber,
        serialNumber: data.serialNumber,
        imageUrl: data.imageUrl,
        cost: data.cost,
        status: data.status || "ACTIVE",
        history: {
          create: {
            action: "CREATED",
            description: "Added to system",
            performedById: data.userId
          }
        }
      }
    })
  }
  /**
   * Get overall inventory statistics for reports.
   */
  static async getStats() {
    const total = await prisma.inventoryItem.count()
    const active = await prisma.inventoryItem.count({ where: { status: "ACTIVE" } })
    const inRepair = await prisma.inventoryItem.count({ where: { status: "IN_REPAIR" } })
    
    // Group by category
    const byCategory = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    })

    return { total, active, inRepair, byCategory }
  }
}
