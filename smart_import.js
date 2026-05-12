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

  // 2. Setup Categories (using keys for multi-language)
  const categories = [
    { key: 'pc', name: 'pc' },
    { key: 'monitor', name: 'monitor' },
    { key: 'printer', name: 'printer' },
    { key: 'projector', name: 'projector' },
    { key: 'camera', name: 'camera' },
    { key: 'audio', name: 'audio' },
    { key: 'network', name: 'network' },
    { key: 'server', name: 'server' },
    { key: 'accessory', name: 'accessory' },
    { key: 'other', name: 'other' }
  ]
  const categoryMap = {}
  for (const cat of categories) {
    const created = await prisma.category.create({ data: { name: cat.key } })
    categoryMap[cat.key] = created.id
  }

  function guessCategory(name) {
    const n = (name || '').toLowerCase()
    if (n.includes('ноутбук') || n.includes('laptop') || n.includes('notebook') || n.includes('компьютер') || n.includes('computer') || n.includes('пк') || n.includes('системный')) return 'pc'
    if (n.includes('монитор') || n.includes('monitor') || n.includes('экран')) return 'monitor'
    if (n.includes('принтер') || n.includes('printer') || n.includes('сканер') || n.includes('mfp') || n.includes('мфу')) return 'printer'
    if (n.includes('проектор') || n.includes('projector')) return 'projector'
    if (n.includes('камер') || n.includes('camera') || n.includes('hikvision')) return 'camera'
    if (n.includes('switch') || n.includes('router') || n.includes('wifi') || n.includes('wi-fi') || n.includes('коммутатор')) return 'network'
    if (n.includes('сервер') || n.includes('server') || n.includes('ups') || n.includes('ибп')) return 'server'
    if (n.includes('кабел') || n.includes('hdmi') || n.includes('удлинитель')) return 'accessory'
    return 'other'
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
    let loc = String(locationStr || '').trim()
    if (!loc) return null

    let branchId = branchName === 'Chilonzor' ? chilBranch.id : itBranch.id
    let buildingId = branchName === 'Chilonzor' ? chilBuildingA.id : itBuilding.id
    
    let floorNum = 1
    let roomName = loc

    // 1. Clean room numbers from strings like "317(Rashidova I.)"
    const roomMatch = loc.match(/([0-9]{3})/);
    if (roomMatch) {
      roomName = roomMatch[1];
      floorNum = parseInt(roomName[0]);
    }

    // 2. Special aggressive grouping
    const lowerLoc = loc.toLowerCase();
    if (lowerLoc.includes('ректорат') || lowerLoc.includes('ректор') || lowerLoc.includes('приёмная')) {
      roomName = 'Rektorat'
      floorNum = branchName === 'IT Campus' ? 6 : 2;
    } else if (lowerLoc.includes('библиотека') || lowerLoc.includes('library')) {
      roomName = 'Library'
      floorNum = branchName === 'IT Campus' ? -1 : 2;
    } else if (lowerLoc.includes('конф зал') || lowerLoc.includes('conference') || lowerLoc.includes('актовый')) {
      roomName = 'Conference Hall'
      floorNum = branchName === 'IT Campus' ? 2 : 3;
    } else if (lowerLoc.includes('столовая') || lowerLoc.includes('oshxona')) {
      roomName = 'Canteen'
      floorNum = 1
    } else if (lowerLoc.includes('шахта')) {
      roomName = 'Shaxta'
      floorNum = -1
    } else if (lowerLoc.includes('операторская') || lowerLoc.includes('operator')) {
      roomName = 'Operator Room'
      floorNum = 3
    } else if (lowerLoc.includes('склад') || lowerLoc.includes('sklad') || lowerLoc.includes('warehouse')) {
      roomName = 'Sklad'
      floorNum = 3
    } else if (lowerLoc.includes('multimedia')) {
      roomName = 'Multimedia'
      floorNum = 2
    }

    // 3. Special case for "Chilanzar" mentioned in IT Campus
    if (lowerLoc.includes('чиланзар') || lowerLoc.includes('chilonzor')) {
       branchId = chilBranch.id;
       buildingId = chilBuildingA.id;
    }

    // 4. Non-floor items (Lift, Shlagbaum, Turniket, KPP, Outside)
    if (lowerLoc.includes('лифт') || lowerLoc.includes('lift') || 
        lowerLoc.includes('шлагбаум') || lowerLoc.includes('shlagbaum') || 
        lowerLoc.includes('кпп') || lowerLoc.includes('turniket') ||
        lowerLoc.includes('gate') || lowerLoc.includes('коридор') || lowerLoc.includes('corridor')) {
      roomName = loc;
      floorNum = 99; // Special "Outside/Common" floor
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
