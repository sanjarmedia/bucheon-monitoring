"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function transferInventoryItem(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const itemId = formData.get("itemId") as string
    const roomId = formData.get("roomId") as string
    const assignedToId = formData.get("assignedToId") as string
    const note = formData.get("note") as string

    if (!itemId || !roomId) return { error: "Item and Room are required" }

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
    if (!item) return { error: "Item not found" }

    const userId = session.user.id as string

    // Log the transfer history
    await prisma.inventoryHistory.create({
      data: {
        itemId: item.id,
        action: "TRANSFERRED",
        description: note || `Tovar ko'chirildi.`,
        fromRoomId: item.roomId,
        toRoomId: roomId,
        fromEmployeeId: item.assignedToId,
        toEmployeeId: assignedToId || null,
        performedById: userId
      }
    })

    // Update the item
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        roomId,
        assignedToId: assignedToId || null
      }
    })

    revalidatePath("/inventory")
    revalidatePath(`/inventory/${itemId}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("Transfer error:", error)
    return { error: error.message || "Xatolik yuz berdi" }
  }
}

export async function bulkTransferInventoryItems(itemIds: string[], roomId: string, assignedToId: string | null, note: string | null) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    if (!itemIds || itemIds.length === 0 || !roomId) {
      return { error: "Items and Room are required" }
    }

    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: itemIds } }
    })

    const userId = session.user.id as string

    // Transaction for safe bulk transfer
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.inventoryHistory.create({
          data: {
            itemId: item.id,
            action: "TRANSFERRED",
            description: note || `Ommaviy ko'chirish.`,
            fromRoomId: item.roomId,
            toRoomId: roomId,
            fromEmployeeId: item.assignedToId,
            toEmployeeId: assignedToId || null,
            performedById: userId
          }
        })
      }

      await tx.inventoryItem.updateMany({
        where: { id: { in: itemIds } },
        data: {
          roomId,
          assignedToId: assignedToId || null
        }
      })
    })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error: any) {
    console.error("Bulk Transfer error:", error)
    return { error: error.message || "Ommaviy ko'chirishda xatolik yuz berdi" }
  }
}
