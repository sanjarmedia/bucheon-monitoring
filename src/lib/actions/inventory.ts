"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function createInventoryItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const categoryId = formData.get("categoryId") as string
  const inventoryNumber = formData.get("inventoryNumber") as string
  const serialNumber = formData.get("serialNumber") as string
  const cost = parseFloat(formData.get("cost") as string)
  const imageFile = formData.get("image") as File | null

  if (!name || !categoryId) {
    throw new Error("Missing required fields")
  }

  let imageUrl = null
  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const { v4: uuidv4 } = require('uuid')
    const { join } = require('path')
    const { writeFile } = require('fs/promises')
    
    const uniqueId = uuidv4()
    const originalExtension = imageFile.name.split('.').pop() || 'png'
    const filename = `${uniqueId}.${originalExtension}`
    
    const uploadDir = join(process.cwd(), "public", "uploads")
    const filePath = join(uploadDir, filename)
    
    await writeFile(filePath, buffer)
    imageUrl = `/uploads/${filename}`
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

  try {
    const { syncToGoogleSheets } = await import("@/lib/googleSheets")
    await syncToGoogleSheets('CREATE', newItem)
  } catch (e) {
    console.error("Google sync error non-fatal", e)
  }

  revalidatePath("/en/inventory")
  revalidatePath("/uz/inventory")
  revalidatePath("/ru/inventory")
}

export async function updateInventoryItem(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const status = formData.get("status") as string
  const cost = parseFloat(formData.get("cost") as string) || 0
  const serialNumber = formData.get("serialNumber") as string
  const inventoryNumber = formData.get("inventoryNumber") as string
  const imageFile = formData.get("image") as File | null

  const data: any = {
    name,
    status,
    cost,
    serialNumber: serialNumber || null,
    inventoryNumber: inventoryNumber || null,
  }

  // Handle new image upload if provided
  if (imageFile && imageFile.size > 0) {
    try {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const { v4: uuidv4 } = require('uuid')
      const { join } = require('path')
      const { writeFile } = require('fs/promises')
      
      const uniqueId = uuidv4()
      const originalExtension = imageFile.name.split('.').pop() || 'png'
      const filename = `${uniqueId}.${originalExtension}`
      const uploadDir = join(process.cwd(), "public", "uploads")
      const filePath = join(uploadDir, filename)
      
      await writeFile(filePath, buffer)
      data.imageUrl = `/uploads/${filename}`
    } catch (err) {
      console.error("Image update error:", err)
    }
  }

  await prisma.inventoryItem.update({
    where: { id },
    data
  })

  const paths = [
    "/en/inventory", "/uz/inventory", "/ru/inventory",
    `/en/inventory/${id}`, `/uz/inventory/${id}`, `/ru/inventory/${id}`
  ]
  paths.forEach(p => revalidatePath(p))
}

export async function deleteInventoryItem(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  await prisma.inventoryItem.delete({
    where: { id }
  })

  revalidatePath("/en/inventory")
  revalidatePath("/uz/inventory")
  revalidatePath("/ru/inventory")
}
