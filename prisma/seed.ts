const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Bucheon Monitoring database...')

  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash('admin', 10)

  // 1. Asosiy Adminni yaratish/yangilash
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bucheon.uz' },
    update: {},
    create: {
      email: 'admin@bucheon.uz',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      password: hashedPassword, 
    },
  })

  // 2. Filiallar (Branches)
  const branches = [
    { name: 'Chilonzor' },
    { name: 'IT Campus' }
  ]

  for (const b of branches) {
    const existing = await prisma.branch.findFirst({
      where: { name: b.name }
    })
    if (!existing) {
      await prisma.branch.create({
        data: b
      })
    }
  }

  const branchList = await prisma.branch.findMany()
  const chilanzar = branchList.find((b: any) => b.name === 'Chilonzor')
  const itCampus = branchList.find((b: any) => b.name === 'IT Campus')

  // 3. Binolar (Buildings)
  // Chilonzor: A va B bloklar
  if (chilanzar) {
    const buildings = ['A Blok', 'B Blok']
    for (const name of buildings) {
      const existing = await prisma.building.findFirst({
        where: { name, branchId: chilanzar.id }
      })
      if (!existing) {
        await prisma.building.create({
          data: { name, branchId: chilanzar.id }
        })
      }
    }
  }

  // IT Campus: bitta bino, -1 dan 6-qavatgacha
  if (itCampus) {
    const existing = await prisma.building.findFirst({
      where: { name: 'IT Bino', branchId: itCampus.id }
    })
    if (!existing) {
      await prisma.building.create({
        data: {
          name: 'IT Bino',
          branchId: itCampus.id,
          floors: {
            create: [-1, 0, 1, 2, 3, 4, 5, 6].map((number: number) => ({ number }))
          }
        }
      })
    }
  }

  // 4. Categoriyalar (Excel'dagi kabi)
  const categories = [
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

  for (const name of categories) {
    const existing = await prisma.category.findFirst({
      where: { name }
    })
    if (!existing) {
      await prisma.category.create({
        data: { name }
      })
    }
  }

  // 5. Tizim sozlamalari
  const settings = [
    { key: 'work_start_time', value: '09:00' },
    { key: 'tg_enabled', value: 'off' },
  ]

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    })
  }

  console.log('✅ Seed muvaffaqiyatli yakunlandi!')
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
