const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get existing buildings
  const buildings = await prisma.building.findMany({
    include: { floors: { include: { rooms: true } } }
  })

  for (const building of buildings) {
    const existingFloorNumbers = building.floors.map(f => f.number)
    console.log(`\n[${building.name}] Existing floors: ${existingFloorNumbers.join(', ') || 'none'}`)

    // Add floors 2, 3, 4 if missing
    for (let floorNum = 1; floorNum <= 4; floorNum++) {
      if (existingFloorNumbers.includes(floorNum)) {
        // Check if floor has rooms, if not add some
        const existingFloor = building.floors.find(f => f.number === floorNum)
        if (existingFloor && existingFloor.rooms.length < 4) {
          const needed = 6 - existingFloor.rooms.length
          for (let r = existingFloor.rooms.length + 1; r <= 6; r++) {
            await prisma.room.create({
              data: {
                number: `${floorNum}0${r}`,
                faculty: floorNum === 3 ? 'Bucheon Litseyi' : null,
                floorId: existingFloor.id,
              }
            })
          }
          console.log(`  Floor ${floorNum}: added ${needed} more rooms`)
        }
        continue
      }

      const floor = await prisma.floor.create({
        data: { number: floorNum, buildingId: building.id }
      })

      const roomCount = floorNum === 1 ? 6 : floorNum === 2 ? 8 : floorNum === 3 ? 10 : 5
      for (let r = 1; r <= roomCount; r++) {
        await prisma.room.create({
          data: {
            number: `${floorNum}0${r}`,
            faculty: floorNum === 3 ? 'Bucheon Litseyi' : null,
            floorId: floor.id,
          }
        })
      }
      console.log(`  Created Floor ${floorNum} with ${roomCount} rooms`)
    }
  }

  // Final count
  const total = await prisma.room.count()
  console.log(`\n✅ Done! Total rooms in DB: ${total}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
