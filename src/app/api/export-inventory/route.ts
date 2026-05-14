import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as xlsx from "xlsx"

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        category: true,
        room: {
          include: {
            floor: { include: { building: { include: { branch: true } } } }
          }
        },
        assignedTo: true
      }
    })

    const data = items.map(item => ({
      ID: item.id,
      Name: item.name,
      Category: item.category.name,
      SerialNumber: item.serialNumber || "",
      Status: item.status,
      Branch: item.room?.floor?.building?.branch?.name || "",
      Building: item.room?.floor?.building?.name || "",
      Floor: item.room?.floor?.number || "",
      Room: item.room?.number || "",
      AssignedEmployee: item.assignedTo?.fullName || "",
      Cost: item.cost || 0,
      PurchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "",
      CreatedAt: new Date(item.createdAt).toLocaleDateString()
    }))

    const worksheet = xlsx.utils.json_to_sheet(data)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, "Inventory")

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="inventory_export.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
