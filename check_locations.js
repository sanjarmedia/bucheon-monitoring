const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const branches = await prisma.branch.findMany({
    include: {
      buildings: {
        include: {
          floors: {
            include: { rooms: true }
          }
        }
      }
    }
  })

  console.log('Branches:', branches.length)
  branches.forEach(b => {
    console.log(`  [Branch] ${b.name} (${b.id})`)
    b.buildings.forEach(bl => {
      console.log(`    [Building] ${bl.name} — ${bl.floors.length} floors`)
      bl.floors.forEach(f => {
        console.log(`      [Floor ${f.number}] — ${f.rooms.length} rooms`)
      })
    })
  })

  // If no branches or floors, seed sample data
  if (branches.length === 0) {
    console.log('\nNo branches found. Creating sample location tree...')
    const branch = await prisma.branch.create({
      data: { name: 'IT Campus' }
    })
    const building = await prisma.building.create({
      data: { name: 'Asosiy bino', branchId: branch.id }
    })

    for (let floorNum = 1; floorNum <= 4; floorNum++) {
      const floor = await prisma.floor.create({
        data: { number: floorNum, buildingId: building.id }
      })
      // Create rooms for each floor
      const roomCount = floorNum === 1 ? 6 : floorNum === 2 ? 8 : floorNum === 3 ? 10 : 5
      const prefix = floorNum * 100
      for (let r = 1; r <= roomCount; r++) {
        await prisma.room.create({
          data: {
            number: `${prefix + r}`,
            faculty: floorNum === 3 ? 'Bucheon Litseyi' : null,
            floorId: floor.id,
          }
        })
      }
      console.log(`  Created Floor ${floorNum} with ${roomCount} rooms`)
    }

    // Also create Chilanzar branch
    const branch2 = await prisma.branch.create({
      data: { name: 'Chilanzar filiali' }
    })
    const building2 = await prisma.building.create({
      data: { name: 'A bino', branchId: branch2.id }
    })
    for (let floorNum = 1; floorNum <= 3; floorNum++) {
      const floor = await prisma.floor.create({
        data: { number: floorNum, buildingId: building2.id }
      })
      for (let r = 1; r <= 5; r++) {
        await prisma.room.create({
          data: {
            number: `A-${floorNum}0${r}`,
            floorId: floor.id,
          }
        })
      }
      console.log(`  Created Chilanzar Floor ${floorNum} with 5 rooms`)
    }

    console.log('✅ Sample location data created!')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
