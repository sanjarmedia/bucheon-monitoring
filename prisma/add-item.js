const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const room = await prisma.room.findFirst({ where: { number: '401' } })
  const cat = await prisma.category.findFirst({ where: { name: 'PC' } })
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })

  if (room && cat && admin) {
    await prisma.inventoryItem.create({
      data: {
        name: 'HP EliteBook 840 G8',
        serialNumber: 'HP-840-401-' + Date.now(),
        inventoryNumber: 'INV-PC-401-' + Date.now(),
        status: 'ACTIVE',
        categoryId: cat.id,
        roomId: room.id,
        assignedToId: admin.id,
      }
    })
    console.log('Item added to 401')
  } else {
    console.log('Room, category or admin not found', { room: !!room, cat: !!cat, admin: !!admin })
  }
}

main().finally(() => prisma.$disconnect())
