const { PrismaClient } = require('@prisma/client')
const xlsx = require('xlsx')
const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING SMART IMPORT ---')
  
  // 1. Clear existing data to avoid mess (Optional, but cleaner)
  await prisma.inventoryHistory.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.roomHistory.deleteMany()
  await prisma.room.deleteMany()
  await prisma.floor.deleteMany()
  await prisma.building.deleteMany()
  await prisma.turnstile.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.category.deleteMany()

  console.log('Database cleared.')

  // 2. Setup Categories
  const categoryNames = [
    'Kompyuter va noutbuk', 'Monitor va ekran', 'Printer va skaner',
    'Proyektor', 'Kamera', 'Audio va video', 'Tarmoq jihozi',
    'Server va UPS', 'Aksesuar va kabel', 'Boshqa texnika'
  ]
  const categoryMap = {}
  for (const name of categoryNames) {
    const cat = await prisma.category.create({ data: { name } })
    categoryMap[name] = cat.id
  }

  function guessCategory(name) {
    const n = (name || '').toLowerCase()
    if (n.includes('ноутбук') || n.includes('laptop') || n.includes('notebook')) return 'Kompyuter va noutbuk'
    if (n.includes('компьютер') || n.includes('computer') || n.includes('пк') || n.includes('системный')) return 'Kompyuter va noutbuk'
    if (n.includes('монитор') || n.includes('monitor') || n.includes('экран')) return 'Monitor va ekran'
    if (n.includes('принтер') || n.includes('printer') || n.includes('сканер') || n.includes('mfp') || n.includes('мфу')) return 'Printer va skaner'
    if (n.includes('проектор') || n.includes('projector')) return 'Proyektor'
    if (n.includes('камер') || n.includes('camera')) return 'Kamera'
    if (n.includes('switch') || n.includes('router') || n.includes('wifi') || n.includes('wi-fi')) return 'Tarmoq jihozi'
    return 'Boshqa texnika'
  }

  // 3. Setup Branches & Buildings
  const itBranch = await prisma.branch.create({ data: { name: 'IT Campus' } })
  const itBuilding = await prisma.building.create({ data: { name: 'IT Building', branchId: itBranch.id } })

  const chilBranch = await prisma.branch.create({ data: { name: 'Chilonzor' } })
  const chilBuildingA = await prisma.building.create({ data: { name: 'Building A', branchId: chilBranch.id } })

  // 4. Helper to get/create Floor and Room
  const floorCache = {}
  const roomCache = {}

  async function getRoom(branchName, locationStr) {
    const loc = String(locationStr || '').trim()
    if (!loc) return null

    let branchId = branchName === 'Chilonzor' ? chilBranch.id : itBranch.id
    let buildingId = branchName === 'Chilonzor' ? chilBuildingA.id : itBuilding.id
    
    let floorNum = 1
    let roomName = loc

    // Logic for IT Campus
    if (branchName === 'IT Campus') {
      if (loc.match(/^[1-6][0-9][0-9]$/)) {
        floorNum = parseInt(loc[0])
      } else if (loc.includes('Ректорат') || loc.includes('ректор') || loc.includes('Приёмная')) {
        floorNum = 6
        roomName = 'Rektorat'
      } else if (loc.toLowerCase().includes('библиотека') || loc.toLowerCase().includes('library')) {
        floorNum = -1
        roomName = 'Library'
      } else if (loc.toLowerCase().includes('конф зал') || loc.toLowerCase().includes('conference')) {
        floorNum = 2
        roomName = 'Conference Hall'
      }
    } else {
      // Logic for Chilonzor
      if (loc.match(/^[1-4][0-9][0-9]$/)) {
        floorNum = parseInt(loc[0])
      } else if (loc.includes('Ректорат')) {
        floorNum = 2
        roomName = 'Rektorat'
      } else if (loc.toLowerCase().includes('library') || loc.toLowerCase().includes('библиотека')) {
        floorNum = 2
        roomName = 'Library'
      } else if (loc.toLowerCase().includes('актовый') || loc.toLowerCase().includes('conference')) {
        floorNum = 3
        roomName = 'Conference Hall'
      } else if (loc.toLowerCase().includes('столовая') || loc.toLowerCase().includes('oshxona')) {
        floorNum = 1
        roomName = 'Canteen'
      }
    }

    const floorKey = `${buildingId}_${floorNum}`
    if (!floorCache[floorKey]) {
      floorCache[floorKey] = (await prisma.floor.create({ data: { number: floorNum, buildingId } })).id
    }

    const roomKey = `${floorCache[floorKey]}_${roomName}`
    if (!roomCache[roomKey]) {
      roomCache[roomKey] = (await prisma.room.create({ data: { number: roomName, floorId: floorCache[floorKey] } })).id
    }

    return roomCache[roomKey]
  }

  // 5. Read Excel
  const wb = xlsx.readFile('Full information tech - BUCHEON UNIVERSITY (6).xlsx')
  let totalImported = 0
  const seenInvNums = new Set()

  // Sheet 1: Chilonzor
  const ws1 = wb.Sheets['Invertar texnika CHILANZAR 2026']
  const rows1 = xlsx.utils.sheet_to_json(ws1, { raw: false })
  for (const row of rows1) {
    const name = row['Наименование товара']
    if (!name || name.toLowerCase().includes('наименование') || name.toLowerCase().includes('итого')) continue
    
    const invNum = row['Инвентарный номер'] ? String(row['Инвентарный номер']).trim() : null
    if (invNum && seenInvNums.has(invNum)) continue
    if (invNum) seenInvNums.add(invNum)

    const roomId = await getRoom('Chilonzor', row['Местоположение'])
    await prisma.inventoryItem.create({
      data: {
        name: String(name).trim(),
        inventoryNumber: invNum,
        categoryId: categoryMap[guessCategory(name)],
        status: 'ACTIVE',
        roomId
      }
    })
    totalImported++
  }

  // Sheet 2: IT Campus
  const ws2 = wb.Sheets['Invertar texnika ITCAMPUS 2026']
  const rows2 = xlsx.utils.sheet_to_json(ws2, { raw: false })
  for (const row of rows2) {
    const name = row['__EMPTY_1']
    if (!name || name === 'Наименование товара') continue
    
    const invNum = row['__EMPTY_2'] ? String(row['__EMPTY_2']).trim() : null
    if (invNum && seenInvNums.has(invNum)) continue
    if (invNum) seenInvNums.add(invNum)

    const roomId = await getRoom('IT Campus', row['__EMPTY_6'])
    await prisma.inventoryItem.create({
      data: {
        name: String(name).trim(),
        inventoryNumber: invNum,
        categoryId: categoryMap[guessCategory(name)],
        status: 'ACTIVE',
        roomId
      }
    })
    totalImported++
  }

  // Sheet 3: Texnikum (as part of IT Campus)
  const ws3 = wb.Sheets['Texnikum spisok']
  const rows3 = xlsx.utils.sheet_to_json(ws3, { raw: false })
  for (const row of rows3) {
    const name = row['Наименование товара']
    if (!name) continue

    const invNum = row['код товара'] ? String(row['код товара']).trim() : null
    if (invNum && seenInvNums.has(invNum)) continue
    if (invNum) seenInvNums.add(invNum)

    const roomId = await getRoom('IT Campus', row['местолоположение'])
    await prisma.inventoryItem.create({
      data: {
        name: String(name).trim(),
        inventoryNumber: invNum,
        categoryId: categoryMap[guessCategory(name)],
        status: 'ACTIVE',
        roomId
      }
    })
    totalImported++
  }

  console.log(`--- IMPORT FINISHED: ${totalImported} items ---`)
}

main().finally(() => prisma.$disconnect())
