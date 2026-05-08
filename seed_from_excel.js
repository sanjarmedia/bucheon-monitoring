const { PrismaClient } = require('@prisma/client')
const xlsx = require('xlsx')

const prisma = new PrismaClient()

async function main() {
  const wb = xlsx.readFile('Full information tech - BUCHEON UNIVERSITY (6).xlsx')

  // ---- Categoriyalarni qo'shamiz ----
  const categoryNames = [
    'Kompyuter va noutbuk',
    'Monitor va ekran',
    'Printer va skaner',
    'Proyektor',
    'Kamera',
    'Audio va video',
    'Tarmoq jihozi',
    'Server va UPS',
    'Aksesuar va kabel',
    'Boshqa texnika',
  ]

  const categoryMap = {}
  for (const name of categoryNames) {
    let cat = await prisma.category.findFirst({ where: { name } })
    if (!cat) {
      cat = await prisma.category.create({ data: { name } })
    }
    categoryMap[name] = cat.id
  }
  console.log('Categories ready:', Object.keys(categoryMap).length)

  // Simple category guesser by item name
  function guessCategory(name) {
    const n = (name || '').toLowerCase()
    if (n.includes('ноутбук') || n.includes('laptop') || n.includes('asus') || n.includes('dell') || n.includes('hp') && n.includes('notebook')) return 'Kompyuter va noutbuk'
    if (n.includes('компьютер') || n.includes('computer') || n.includes('пк') || n.includes('системный') || n.includes('system unit')) return 'Kompyuter va noutbuk'
    if (n.includes('монитор') || n.includes('monitor') || n.includes('экран') && !n.includes('проектор')) return 'Monitor va ekran'
    if (n.includes('принтер') || n.includes('printer') || n.includes('сканер') || n.includes('scanner') || n.includes('mfp') || n.includes('мфу')) return 'Printer va skaner'
    if (n.includes('проектор') || n.includes('projector') || n.includes('проекцион')) return 'Proyektor'
    if (n.includes('камер') || n.includes('camera') || n.includes('hikvision') || n.includes('dahua') || n.includes('видеокамер')) return 'Kamera'
    if (n.includes('микрофон') || n.includes('microphone') || n.includes('колонк') || n.includes('акустик') || n.includes('speaker') || n.includes('аудио') || n.includes('усилитель')) return 'Audio va video'
    if (n.includes('switch') || n.includes('роутер') || n.includes('router') || n.includes('wifi') || n.includes('wi-fi') || n.includes('коммутатор') || n.includes('маршрутизатор')) return 'Tarmoq jihozi'
    if (n.includes('сервер') || n.includes('server') || n.includes('ups') || n.includes('ибп')) return 'Server va UPS'
    if (n.includes('кабел') || n.includes('кабель') || n.includes('провод') || n.includes('переходник') || n.includes('hdmi') || n.includes('удлинитель') || n.includes('пилот')) return 'Aksesuar va kabel'
    return 'Boshqa texnika'
  }

  let totalInserted = 0
  let totalSkipped = 0

  // ---- CHILANZAR sheet ----
  async function importSheet(sheetName, nameCol, invCol, locationCol, branch = 'Chilanzar') {
    const ws = wb.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(ws, { raw: false })
    
    const items = []
    for (const row of rows) {
      const name = row[nameCol]
      if (!name || name.toLowerCase().includes('наименование') || name.toLowerCase().includes('всего') || name.toLowerCase().includes('итого')) continue
      
      const invNum = row[invCol] ? String(row[invCol]).trim() : null
      const location = row[locationCol] ? String(row[locationCol]).trim() : null
      const catName = guessCategory(name)

      items.push({
        name: String(name).trim(),
        inventoryNumber: invNum || null,
        categoryId: categoryMap[catName],
        status: 'ACTIVE',
        warrantyInfo: location ? `Joylashuvi: ${location}` : null,
      })
    }

    // Remove duplicates by inventoryNumber within this batch
    const seen = new Set()
    const unique = items.filter(item => {
      if (!item.inventoryNumber) return true
      if (seen.has(item.inventoryNumber)) return false
      seen.add(item.inventoryNumber)
      return true
    })

    // Check existing inv numbers to avoid DB conflict
    const existingInvNums = await prisma.inventoryItem.findMany({
      where: { inventoryNumber: { in: unique.filter(i => i.inventoryNumber).map(i => i.inventoryNumber) } },
      select: { inventoryNumber: true }
    })
    const existingSet = new Set(existingInvNums.map(e => e.inventoryNumber))

    const toInsert = unique.filter(i => !i.inventoryNumber || !existingSet.has(i.inventoryNumber))
    const skipped = unique.length - toInsert.length

    if (toInsert.length > 0) {
      const result = await prisma.inventoryItem.createMany({ data: toInsert })
      totalInserted += result.count
      totalSkipped += skipped
      console.log(`[${sheetName}] ✅ Inserted: ${result.count}, Skipped (duplicate): ${skipped}`)
    } else {
      console.log(`[${sheetName}] ⚠️  All ${unique.length} rows already exist.`)
    }
  }

  // CHILANZAR sheet has clean headers
  await importSheet(
    'Invertar texnika CHILANZAR 2026',
    'Наименование товара',
    'Инвентарный номер',
    'Местоположение',
    'Chilanzar'
  )

  // ITCAMPUS sheet has shifted headers (row 2 is actual header)
  const ws1 = wb.Sheets['Invertar texnika ITCAMPUS 2026']
  const rows1 = xlsx.utils.sheet_to_json(ws1, { raw: false })
  
  const itItems = []
  for (const row of rows1) {
    const name = row['__EMPTY_1']
    if (!name || name === 'Наименование товара') continue
    const invNum = row['__EMPTY_2'] ? String(row['__EMPTY_2']).trim() : null
    const cost = row['__EMPTY_4'] ? parseFloat(String(row['__EMPTY_4']).replace(/[^0-9.]/g, '')) : null
    const location = row['__EMPTY_6'] ? String(row['__EMPTY_6']).trim() : null
    const catName = guessCategory(name)

    itItems.push({
      name: String(name).trim(),
      inventoryNumber: invNum || null,
      categoryId: categoryMap[catName],
      status: 'ACTIVE',
      cost: isNaN(cost) ? null : cost,
      warrantyInfo: location ? `Joylashuvi: ${location}` : null,
    })
  }

  // Dedupe
  const seenIT = new Set()
  const uniqueIT = itItems.filter(item => {
    if (!item.inventoryNumber) return true
    if (seenIT.has(item.inventoryNumber)) return false
    seenIT.add(item.inventoryNumber)
    return true
  })

  const existingIT = await prisma.inventoryItem.findMany({
    where: { inventoryNumber: { in: uniqueIT.filter(i => i.inventoryNumber).map(i => i.inventoryNumber) } },
    select: { inventoryNumber: true }
  })
  const existingITSet = new Set(existingIT.map(e => e.inventoryNumber))
  const toInsertIT = uniqueIT.filter(i => !i.inventoryNumber || !existingITSet.has(i.inventoryNumber))

  if (toInsertIT.length > 0) {
    const r = await prisma.inventoryItem.createMany({ data: toInsertIT })
    totalInserted += r.count
    console.log(`[IT CAMPUS] ✅ Inserted: ${r.count}, Skipped: ${uniqueIT.length - r.count}`)
  }

  // Texnikum sheet
  const ws3 = wb.Sheets['Texnikum spisok']
  const rows3 = xlsx.utils.sheet_to_json(ws3, { raw: false })
  const txItems = []
  for (const row of rows3) {
    const name = row['Наименование товара']
    if (!name) continue
    const invNum = row['код товара'] ? String(row['код товара']).trim() : null
    const location = row['местолоположение'] ? String(row['местолоположение']).trim() : null
    const catName = guessCategory(name)
    txItems.push({
      name: String(name).trim(),
      inventoryNumber: invNum || null,
      categoryId: categoryMap[catName],
      status: 'ACTIVE',
      warrantyInfo: location ? `Joylashuvi: ${location}` : null,
    })
  }

  const seenTX = new Set()
  const uniqueTX = txItems.filter(item => {
    if (!item.inventoryNumber) return true
    if (seenTX.has(item.inventoryNumber)) return false
    seenTX.add(item.inventoryNumber)
    return true
  })

  const existingTX = await prisma.inventoryItem.findMany({
    where: { inventoryNumber: { in: uniqueTX.filter(i => i.inventoryNumber).map(i => i.inventoryNumber) } },
    select: { inventoryNumber: true }
  })
  const existingTXSet = new Set(existingTX.map(e => e.inventoryNumber))
  const toInsertTX = uniqueTX.filter(i => !i.inventoryNumber || !existingTXSet.has(i.inventoryNumber))

  if (toInsertTX.length > 0) {
    const r = await prisma.inventoryItem.createMany({ data: toInsertTX })
    totalInserted += r.count
    console.log(`[TEXNIKUM] ✅ Inserted: ${r.count}, Skipped: ${uniqueTX.length - r.count}`)
  }

  console.log(`\n🎉 DONE! Total Inserted: ${totalInserted} | Total Skipped: ${totalSkipped}`)

  const total = await prisma.inventoryItem.count()
  console.log(`📦 Total items in DB now: ${total}`)
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(async () => { await prisma.$disconnect() })
