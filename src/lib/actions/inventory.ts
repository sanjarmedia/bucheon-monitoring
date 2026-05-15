"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function createInventoryItem(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const categoryId = formData.get("categoryId") as string
    const inventoryNumber = formData.get("inventoryNumber") as string
    const serialNumber = formData.get("serialNumber") as string
    const cost = parseFloat(formData.get("cost") as string)
    const imageFile = formData.get("image") as File | null

    if (!name || !categoryId) {
      return { error: "Missing required fields" }
    }

    let imageUrl = null
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`
    }


    const { InventoryService } = await import("@/services/InventoryService")
    const status = (formData.get("status") as string) || "ACTIVE"

    const newItem = await InventoryService.createItem({
      name,
      categoryId,
      inventoryNumber: inventoryNumber || null,
      serialNumber: serialNumber || null,
      imageUrl: imageUrl,
      cost: isNaN(cost) ? null : cost,
      status: status,
      userId: session.user.id
    })

    revalidatePath("/inventory")
    return { success: true, item: newItem }
  } catch (error: any) {
    console.error("Create item error:", error)
    return { error: error.message || "Kutilmagan xato yuz berdi" }
  }
}

export async function updateInventoryItem(formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "Sessiya topilmadi" }

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const status = formData.get("status") as string
    const costStr = formData.get("cost") as string
    const cost = costStr ? parseFloat(costStr) : null
    const serialNumber = formData.get("serialNumber") as string
    const inventoryNumber = formData.get("inventoryNumber") as string
    const imageFile = formData.get("image") as File | null

    if (!id) return { error: "ID topilmadi" }

    const data: any = {
      name,
      status,
      cost,
      serialNumber: serialNumber || null,
      inventoryNumber: inventoryNumber || null,
    }

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      data.imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`
    }

    await prisma.inventoryItem.update({
      where: { id },
      data
    })

    revalidatePath("/inventory")
    revalidatePath(`/inventory/${id}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("Update inventory error:", error)
    return { error: error.message || "Tahrirlashda xato yuz berdi" }
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return { error: "Unauthorized" }
    }

    await prisma.inventoryItem.delete({
      where: { id }
    })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
