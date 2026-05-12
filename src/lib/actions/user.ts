"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function createEmployee(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
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
  const id = formData.get("id") as string
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
