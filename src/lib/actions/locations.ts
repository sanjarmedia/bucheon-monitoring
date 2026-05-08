"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const checkAuth = async () => {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Only Admins can manage locations")
  }
}

export async function createBranch(formData: FormData) {
  await checkAuth()
  const name = formData.get("name") as string
  if (!name) throw new Error("Name is required")

  await prisma.branch.create({ data: { name } })
  revalidatePath("/en/locations")
  revalidatePath("/uz/locations")
  revalidatePath("/ru/locations")
}

export async function createBuilding(formData: FormData) {
  await checkAuth()
  const name = formData.get("name") as string
  const branchId = formData.get("branchId") as string
  if (!name || !branchId) throw new Error("Name and Branch are required")

  await prisma.building.create({ data: { name, branchId } })
  revalidatePath("/en/locations")
  revalidatePath("/uz/locations")
  revalidatePath("/ru/locations")
}

export async function createFloor(formData: FormData) {
  await checkAuth()
  const number = parseInt(formData.get("number") as string)
  const buildingId = formData.get("buildingId") as string
  if (isNaN(number) || !buildingId) throw new Error("Floor number and Building are required")

  await prisma.floor.create({ data: { number, buildingId } })
  revalidatePath("/en/locations")
  revalidatePath("/uz/locations")
  revalidatePath("/ru/locations")
}

export async function createRoom(formData: FormData) {
  await checkAuth()
  const number = formData.get("number") as string
  const floorId = formData.get("floorId") as string
  const faculty = formData.get("faculty") as string
  const responsibleId = formData.get("responsibleId") as string
  const responsibleSince = formData.get("responsibleSince") as string
  const inventoryIds = formData.getAll("inventoryIds") as string[]
  const initialInventory = formData.get("initialInventory") as string

  if (!number || !floorId) throw new Error("Room number and Floor are required")

  const room = await prisma.room.create({
    data: {
      number,
      floorId,
      faculty: faculty || null,
      responsibleId: responsibleId || null,
      responsibleSince: responsibleSince ? new Date(responsibleSince) : null,
    }
  })

  // Log creation history
  await prisma.roomHistory.create({
    data: {
      roomId: room.id,
      action: "CREATED",
      description: `Xona "${number}" yaratildi`,
    }
  })

  // If initialInventory provided (comma separated inventory numbers)
  if (initialInventory) {
    const invNumbers = initialInventory.split(',').map(s => s.trim()).filter(Boolean)
    if (invNumbers.length > 0) {
      const items = await prisma.inventoryItem.findMany({
        where: { inventoryNumber: { in: invNumbers } }
      })
      
      if (items.length > 0) {
        await prisma.inventoryItem.updateMany({
          where: { id: { in: items.map(i => i.id) } },
          data: { roomId: room.id }
        })
        
        await prisma.roomHistory.create({
          data: {
            roomId: room.id,
            action: "INVENTORY_ADDED",
            description: `${items.length} ta mavjud jihoz xonaga biriktirildi`,
          }
        })
      }
    }
  }

  // If faculty set, log it
  if (faculty) {
    await prisma.roomHistory.create({
      data: {
        roomId: room.id,
        action: "FACULTY_CHANGED",
        description: `Bo'lim/kafedra: "${faculty}" belgilandi`,
      }
    })
  }

  // If responsible set, log it
  if (responsibleId) {
    const user = await prisma.user.findUnique({ where: { id: responsibleId } })
    await prisma.roomHistory.create({
      data: {
        roomId: room.id,
        action: "RESPONSIBLE_CHANGED",
        description: `Javobgar: "${user?.fullName}" tayinlandi`,
        performedBy: user?.fullName || responsibleId,
      }
    })
  }

  // Assign inventory items to this room
  if (inventoryIds.length > 0) {
    await prisma.inventoryItem.updateMany({
      where: { id: { in: inventoryIds } },
      data: { roomId: room.id }
    })
    await prisma.roomHistory.create({
      data: {
        roomId: room.id,
        action: "INVENTORY_ADDED",
        description: `${inventoryIds.length} ta jihoz xonaga biriktirildi`,
      }
    })
  }

  revalidatePath("/en/locations")
  revalidatePath("/uz/locations")
  revalidatePath("/ru/locations")
}

export async function bulkCreateRooms(formData: FormData) {
  await checkAuth()
  const floorId = formData.get("floorId") as string
  const start = parseInt(formData.get("start") as string)
  const end = parseInt(formData.get("end") as string)
  const prefix = (formData.get("prefix") as string) || ""

  if (!floorId || isNaN(start) || isNaN(end) || start > end) {
    throw new Error("Invalid parameters for bulk creation")
  }

  const roomsToCreate = []
  for (let i = start; i <= end; i++) {
    roomsToCreate.push({
      number: `${prefix}${i}`,
      floorId
    })
  }

  await prisma.room.createMany({
    data: roomsToCreate
  })

  revalidatePath("/en/locations")
  revalidatePath("/uz/locations")
  revalidatePath("/ru/locations")
}

export async function updateRoomDetails(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const { LocationService } = await import("@/services/LocationService")
  
  const roomId = formData.get("roomId") as string
  const faculty = formData.get("faculty") as string

  if (!roomId) throw new Error("Missing room ID")

  await LocationService.updateRoomMetadata(roomId, {
    faculty: faculty || null,
  })

  revalidatePath(`/en/locations/rooms/${roomId}`)
  revalidatePath(`/uz/locations/rooms/${roomId}`)
  revalidatePath(`/ru/locations/rooms/${roomId}`)
}

export async function assignInventoryToRoom(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const roomId = formData.get("roomId") as string
  const isManual = formData.get("isManual") === "true"
  const inventoryIds = formData.getAll("inventoryIds") as string[]
  
  const { LocationService } = await import("@/services/LocationService")
  const { prisma } = await import("@/lib/prisma")

  if (isManual) {
    const name = formData.get("name") as string
    const categoryId = formData.get("categoryId") as string
    const inventoryNumber = formData.get("inventoryNumber") as string
    const serialNumber = formData.get("serialNumber") as string

    if (!name || !categoryId) throw new Error("Nom va kategoriya majburiy")

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        categoryId,
        roomId,
        inventoryNumber: inventoryNumber || null,
        serialNumber: serialNumber || null,
        status: "ACTIVE",
        history: {
          create: {
            action: "CREATED",
            description: "Xona ichida qo'lda yaratildi",
            performedById: session.user.id
          }
        }
      }
    })

    await prisma.roomHistory.create({
      data: {
        roomId,
        action: "INVENTORY_ADDED",
        description: `Yangi jihoz yaratildi va qo'shildi: ${name}`,
        performedBy: session.user.name || undefined
      }
    })
  } else {
    if (!roomId || inventoryIds.length === 0) throw new Error("Missing parameters")
    await LocationService.transferInventoryToRoom(roomId, inventoryIds, session.user.name || undefined)
  }

  revalidatePath(`/en/locations/rooms/${roomId}`)
  revalidatePath(`/uz/locations/rooms/${roomId}`)
  revalidatePath(`/ru/locations/rooms/${roomId}`)
}
