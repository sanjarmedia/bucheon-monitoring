const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get first category
  const pcCat = await prisma.category.findFirst({ where: { name: 'PC' } })
  const projCat = await prisma.category.findFirst({ where: { name: 'Projector' } })
  
  // Get first room
  const room = await prisma.room.findFirst()
  
  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })

  if (pcCat && room && admin) {
    await prisma.inventoryItem.create({
      data: {
        name: 'HP EliteBook 840 G8',
        serialNumber: 'HP-840-001',
        barcode: 'BC-10001',
        status: 'ACTIVE',
        purchaseDate: new Date(),
        cost: 1200.00,
        categoryId: pcCat.id,
        roomId: room.id,
        assignedToId: admin.id,
        history: {
          create: {
            action: 'CREATED',
            description: 'Initial import',
            performedById: admin.id,
            newStatus: 'ACTIVE',
            toRoomId: room.id,
            toEmployeeId: admin.id
          }
        }
      }
    })
  }

  if (projCat && room && admin) {
    await prisma.inventoryItem.create({
      data: {
        name: 'Epson Pro EX9220',
        serialNumber: 'EPS-PRO-992',
        barcode: 'BC-10002',
        status: 'IN_REPAIR',
        purchaseDate: new Date(),
        cost: 800.00,
        categoryId: projCat.id,
        roomId: room.id,
        assignedToId: admin.id,
        history: {
          create: {
            action: 'CREATED',
            description: 'Initial import',
            performedById: admin.id,
            newStatus: 'IN_REPAIR'
          }
        }
      }
    })
  }

  console.log('Inventory seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

export {}
