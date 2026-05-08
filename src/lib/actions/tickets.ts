"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { TicketService } from "@/services/TicketService"

export async function createTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const roomId = formData.get("roomId") as string

  if (!category || !description) {
    throw new Error("Missing required fields")
  }

  await TicketService.createTicket({
    category,
    description,
    priority,
    roomId: roomId || undefined,
    createdById: session.user.id,
  })

  revalidatePath("/en/requests")
  revalidatePath("/uz/requests")
  revalidatePath("/ru/requests")
}

export async function resolveTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const ticketId = formData.get("ticketId") as string
  const resolutionComment = formData.get("resolutionComment") as string
  const status = formData.get("status") as string || "COMPLETED"

  if (!ticketId) {
    throw new Error("Missing Ticket ID")
  }

  await TicketService.updateStatus(ticketId, status, session.user.id, resolutionComment)

  revalidatePath("/en/requests")
  revalidatePath("/uz/requests")
  revalidatePath("/ru/requests")
}
