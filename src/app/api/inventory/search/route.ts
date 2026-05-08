import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ items: [] })
  }

  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { inventoryNumber: { contains: query } },
        { serialNumber: { contains: query } },
      ],
    },
    select: {
      id: true,
      name: true,
      inventoryNumber: true,
      serialNumber: true,
      status: true,
    },
    take: 10,
  })

  return NextResponse.json({ items })
}
