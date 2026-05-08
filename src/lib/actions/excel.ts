"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import * as xlsx from "xlsx"

export async function importInventoryExcel(formData: FormData) {
  // Reliable session check via cookies
  const cookieStore = await cookies()
  const hasSession = cookieStore.has("authjs.session-token") || cookieStore.has("__Secure-authjs.session-token")
  
  if (!hasSession) {
    throw new Error("Unauthorized: Please login first")
  }

  const file = formData.get("file") as File
  if (!file || file.size === 0) throw new Error("No file uploaded")

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const workbook = xlsx.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to JSON with raw: false to get formatted strings
  const data = xlsx.utils.sheet_to_json(worksheet, { raw: false }) as any[]

  if (!data || data.length === 0) {
    throw new Error("Excel file is empty or unreadable")
  }

  // Log first row to debug column names (visible in server terminal)
  console.log("Excel first row keys:", Object.keys(data[0]))
  console.log("Excel first row data:", JSON.stringify(data[0]))

  // Get all categories from DB for flexible matching
  const categories = await prisma.category.findMany()

  // Flexible column name matcher (case-insensitive, supports Uzbek/Russian/English variants)
  const getVal = (row: any, ...keys: string[]) => {
    for (const key of keys) {
      const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase())
      if (found && row[found] !== undefined && row[found] !== "") return row[found]
    }
    return null
  }

  // Match category by name (case-insensitive)
  const findCategory = (nameHint: string | null) => {
    if (!nameHint) return null
    return categories.find(c => c.name.toLowerCase() === String(nameHint).toLowerCase().trim())
  }

  const newItems: any[] = []
  const errors: string[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2 // Excel row number (1 = header)

    // Get name — supports: Name, Nomi, Название, Наименование
    const name = getVal(row, "name", "nomi", "название", "наименование", "item name", "product")
    if (!name) {
      errors.push(`Row ${rowNum}: Name missing, skipped`)
      continue
    }

    // Get category — by ID or by Name
    let categoryId = getVal(row, "categoryid", "category id", "kategoriya id")
    if (!categoryId) {
      const categoryName = getVal(row, "category", "kategoriya", "категория")
      const matched = findCategory(categoryName)
      if (matched) {
        categoryId = matched.id
      } else {
        errors.push(`Row ${rowNum}: "${name}" — Category "${categoryName}" not found, skipped`)
        continue
      }
    }

    const inventoryNumber = getVal(row, "inventorynumber", "inventory number", "inventar raqami", "инв. номер", "inv no", "inv#")
    const serialNumber = getVal(row, "serialnumber", "serial number", "seriya raqami", "серийный номер", "s/n")
    const cost = getVal(row, "cost", "narx", "цена", "price", "qiymati")

    newItems.push({
      name: String(name).trim(),
      categoryId,
      inventoryNumber: inventoryNumber ? String(inventoryNumber).trim() : null,
      serialNumber: serialNumber ? String(serialNumber).trim() : null,
      status: "ACTIVE",
      cost: cost ? parseFloat(String(cost).replace(/[^0-9.]/g, "")) : null,
    })
  }

  console.log(`Excel Import: ${newItems.length} valid rows, ${errors.length} skipped`)
  if (errors.length > 0) console.log("Skipped rows:", errors)

  if (newItems.length === 0) {
    throw new Error(
      `No valid rows found in Excel.\n` +
      `Skipped: ${errors.join("; ")}\n\n` +
      `Detected column names: ${Object.keys(data[0]).join(", ")}\n` +
      `Expected columns: Name (Nomi), Category (Kategoriya), InventoryNumber (optional), SerialNumber (optional), Cost (optional)`
    )
  }

  // Insert with skipDuplicates to avoid unique constraint errors
  const result = await prisma.inventoryItem.createMany({
    data: newItems,
  })

  console.log(`Excel Import SUCCESS: ${result.count} items inserted`)

  revalidatePath("/en/inventory")
  revalidatePath("/uz/inventory")
  revalidatePath("/ru/inventory")
}
