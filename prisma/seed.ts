const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create test user (Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  // Create Branches
  const itCampus = await prisma.branch.create({
    data: {
      name: 'IT Campus',
      buildings: {
        create: [
          {
            name: 'IT Building',
            floors: {
              create: [
                { number: -1, rooms: { create: [{ number: 'B-01', faculty: 'Archive' }] } },
                { number: 0, rooms: { create: [{ number: 'G-01', faculty: 'Reception' }] } },
                { number: 1, rooms: { create: [{ number: '101' }, { number: '102' }] } },
                { number: 2, rooms: { create: [{ number: '201' }, { number: '202' }] } },
                { number: 3, rooms: { create: [{ number: '301', faculty: 'Litsey' }, { number: '302', faculty: 'Litsey' }] } },
                { number: 4, rooms: { create: [{ number: '401' }, { number: '402' }] } },
                { number: 5, rooms: { create: [{ number: '501' }, { number: '502' }] } },
                { number: 6, rooms: { create: [{ number: '601' }, { number: '602' }] } },
              ]
            }
          }
        ]
      }
    }
  })

  const chilonzor = await prisma.branch.create({
    data: {
      name: 'Chilonzor',
      buildings: {
        create: [
          {
            name: 'Building A',
            floors: {
              create: [
                { number: 1, rooms: { create: [{ number: 'A-101' }] } },
                { number: 2, rooms: { create: [{ number: 'A-201' }] } },
              ]
            }
          },
          {
            name: 'Building B',
            floors: {
              create: [
                { number: 1, rooms: { create: [{ number: 'B-101' }] } },
                { number: 2, rooms: { create: [{ number: 'B-201' }] } },
              ]
            }
          }
        ]
      }
    }
  })

  // Categories
  const pcCategory = await prisma.category.create({ data: { name: 'PC' } })
  const printerCategory = await prisma.category.create({ data: { name: 'Printer' } })
  const projectorCategory = await prisma.category.create({ data: { name: 'Projector' } })

  // Find a room to assign items to (e.g., 401)
  const room401 = await prisma.room.findFirst({ where: { number: '401' } })

  if (room401) {
    await prisma.inventoryItem.create({
      data: {
        name: 'HP EliteBook 840 G8',
        serialNumber: 'HP-840-401',
        inventoryNumber: 'INV-PC-401',
        status: 'ACTIVE',
        categoryId: pcCategory.id,
        roomId: room401.id,
        assignedToId: admin.id,
      }
    })

    await prisma.inventoryItem.create({
      data: {
        name: 'Epson Pro Projector',
        serialNumber: 'EPS-PRO-401',
        inventoryNumber: 'INV-PJ-401',
        status: 'ACTIVE',
        categoryId: projectorCategory.id,
        roomId: room401.id,
        assignedToId: admin.id,
      }
    })
  }

  console.log({ admin, itCampus, chilonzor, room401: room401?.number })
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
