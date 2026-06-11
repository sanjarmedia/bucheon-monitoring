/**
 * Lokatsiyalarni tozalab, yangi struktura yaratadi:
 *  - IT Campus: bitta "IT Bino" (-1 dan 6-qavatgacha)
 *  - Chilonzor: "A Blok" va "B Blok"
 *
 * Eslatma: barcha eski xona/qavat/bino/filiallar o'chiriladi.
 * Inventar va zayavkalar SAQLANADI, faqat xonaga biriktirilishi bekor qilinadi.
 * Ishga tushirish: npx ts-node --compiler-options {"module":"CommonJS"} prisma/reset-locations.ts
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Eski lokatsiyalar tozalanmoqda...')

  // 1. Xonalarga bog'lanishlarni uzish (ma'lumotlar o'chmaydi)
  await prisma.inventoryItem.updateMany({ where: { roomId: { not: null } }, data: { roomId: null } })
  await prisma.ticket.updateMany({ where: { roomId: { not: null } }, data: { roomId: null } })
  await prisma.user.updateMany({ where: { roomId: { not: null } }, data: { roomId: null } })
  await prisma.room.updateMany({ where: { responsibleId: { not: null } }, data: { responsibleId: null } })

  // 2. Lokatsiya daraxtini o'chirish
  await prisma.roomHistory.deleteMany({})
  await prisma.room.deleteMany({})
  await prisma.floor.deleteMany({})
  await prisma.attendanceLog.deleteMany({})
  await prisma.turnstile.deleteMany({})
  await prisma.building.deleteMany({})
  await prisma.branch.deleteMany({})

  console.log('🏗  Yangi struktura yaratilmoqda...')

  // 3. IT Campus: bitta bino, -1 dan 6 gacha qavatlar
  await prisma.branch.create({
    data: {
      name: 'IT Campus',
      buildings: {
        create: [
          {
            name: 'IT Bino',
            floors: {
              create: [-1, 0, 1, 2, 3, 4, 5, 6].map((number: number) => ({ number }))
            }
          }
        ]
      }
    }
  })

  // 4. Chilonzor: A va B bloklar
  await prisma.branch.create({
    data: {
      name: 'Chilonzor',
      buildings: {
        create: [
          { name: 'A Blok' },
          { name: 'B Blok' }
        ]
      }
    }
  })

  console.log('✅ Tayyor!')
  console.log('   IT Campus → IT Bino: -1, 0, 1, 2, 3, 4, 5, 6 qavatlar')
  console.log('   Chilonzor → A Blok, B Blok')
  console.log('   Xonalarni endi Lokatsiyalar sahifasida "Ommaviy qo\'shish" bilan yarating.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e: any) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

export {}
