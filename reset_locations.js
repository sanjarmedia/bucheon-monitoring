const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 1. Clear all existing location data (rooms → floors → buildings → branches)
  console.log('🗑️  Cleaning old data...')
  await prisma.room.deleteMany()
  await prisma.floor.deleteMany()
  await prisma.building.deleteMany()
  await prisma.branch.deleteMany()
  console.log('   Done.')

  // ============================================
  // 2. IT CAMPUS — 1 ta bino, qavatlar -1 dan 6 gacha
  // ============================================
  console.log('\n🏢 Creating IT Campus...')
  const itCampus = await prisma.branch.create({ data: { name: 'IT Campus' } })
  const itBuilding = await prisma.building.create({
    data: { name: 'Asosiy bino', branchId: itCampus.id }
  })

  const itFloors = [
    { number: -1, label: 'Podval', roomCount: 4, prefix: 'P' },
    { number: 1,  label: null,     roomCount: 8, prefix: '1' },
    { number: 2,  label: null,     roomCount: 10, prefix: '2' },
    { number: 3,  label: 'Litsey', roomCount: 12, prefix: '3' },
    { number: 4,  label: null,     roomCount: 8,  prefix: '4' },
    { number: 5,  label: null,     roomCount: 6,  prefix: '5' },
    { number: 6,  label: null,     roomCount: 4,  prefix: '6' },
  ]

  for (const fl of itFloors) {
    const floor = await prisma.floor.create({
      data: { number: fl.number, buildingId: itBuilding.id }
    })
    for (let r = 1; r <= fl.roomCount; r++) {
      const roomNum = fl.number === -1 ? `P-${r}` : `${fl.prefix}0${r}`
      await prisma.room.create({
        data: {
          number: roomNum,
          faculty: fl.label,   // 3-qavat uchun "Litsey"
          floorId: floor.id,
        }
      })
    }
    const tag = fl.label ? ` (${fl.label})` : ''
    console.log(`   ${fl.number >= 0 ? ' ' : ''}${fl.number}-qavat${tag}: ${fl.roomCount} xona`)
  }

  // ============================================
  // 3. CHILONZOR FILIALI — 2 ta bino: A bino, B bino
  // ============================================
  console.log('\n🏢 Creating Chilonzor filiali...')
  const chilonzor = await prisma.branch.create({ data: { name: 'Chilonzor filiali' } })

  // --- A bino ---
  const binoA = await prisma.building.create({
    data: { name: 'A bino', branchId: chilonzor.id }
  })
  const aFloors = [
    { number: 1, roomCount: 6 },
    { number: 2, roomCount: 8 },
    { number: 3, roomCount: 8 },
    { number: 4, roomCount: 6 },
  ]
  for (const fl of aFloors) {
    const floor = await prisma.floor.create({
      data: { number: fl.number, buildingId: binoA.id }
    })
    for (let r = 1; r <= fl.roomCount; r++) {
      await prisma.room.create({
        data: {
          number: `A-${fl.number}0${r}`,
          floorId: floor.id,
        }
      })
    }
    console.log(`   A bino ${fl.number}-qavat: ${fl.roomCount} xona`)
  }

  // --- B bino ---
  const binoB = await prisma.building.create({
    data: { name: 'B bino', branchId: chilonzor.id }
  })
  const bFloors = [
    { number: 1, roomCount: 5 },
    { number: 2, roomCount: 7 },
    { number: 3, roomCount: 7 },
  ]
  for (const fl of bFloors) {
    const floor = await prisma.floor.create({
      data: { number: fl.number, buildingId: binoB.id }
    })
    for (let r = 1; r <= fl.roomCount; r++) {
      await prisma.room.create({
        data: {
          number: `B-${fl.number}0${r}`,
          floorId: floor.id,
        }
      })
    }
    console.log(`   B bino ${fl.number}-qavat: ${fl.roomCount} xona`)
  }

  // Final summary
  const totalRooms = await prisma.room.count()
  const totalFloors = await prisma.floor.count()
  console.log(`\n✅ Tayyor! Jami: ${totalFloors} ta qavat, ${totalRooms} ta xona`)
}

main()
  .catch(e => console.error('❌', e))
  .finally(async () => { await prisma.$disconnect() })
