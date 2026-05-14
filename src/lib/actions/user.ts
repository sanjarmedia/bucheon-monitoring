"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

import { auth } from "@/auth"

export async function createEmployee(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized: Only admins can create employees")
  }

  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error("A user with this email already exists")
  }

  const role = formData.get("role") as any
  const image = formData.get("image") as File | null

  let imageUrl = null

  if (image && image.size > 0) {
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads", "users")
    await mkdir(uploadDir, { recursive: true })

    const filename = `${Date.now()}-${image.name}`
    const path = join(uploadDir, filename)
    await writeFile(path, buffer)
    imageUrl = `/uploads/users/${filename}`
  }

  await prisma.user.create({
    data: {
      fullName,
      email,
      role,
      imageUrl
    }
  })

  revalidatePath("/employees")
  revalidatePath("/[locale]/employees", "page")
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  const id = formData.get("id") as string

  if (!session || (session.user as any).id !== id && (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized")
  }

  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const image = formData.get("image") as File | null

  let data: any = {
    fullName,
    email
  }

  if (image && image.size > 0) {
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = join(process.cwd(), "public", "uploads", "users")
    await mkdir(uploadDir, { recursive: true })
    const filename = `${Date.now()}-${image.name}`
    const path = join(uploadDir, filename)
    await writeFile(path, buffer)
    data.imageUrl = `/uploads/users/${filename}`
  }

  await prisma.user.update({
    where: { id },
    data
  })

  revalidatePath("/profile")
  revalidatePath("/employees")
}

export async function deleteEmployee(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Only Super Admins can delete employees")
  }

  // Check if user is trying to delete themselves
  if ((session.user as any).id === id) {
    throw new Error("You cannot delete your own account")
  }

  await prisma.user.delete({
    where: { id }
  })

  revalidatePath("/employees")
}
