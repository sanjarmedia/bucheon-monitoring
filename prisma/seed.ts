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
    { name: 'Chilonzor Filiali' },
    { name: 'IT Campus' },
    { name: 'Texnikum' }
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
  const chilanzar = branchList.find((b: any) => b.name === 'Chilonzor Filiali')
  const itCampus = branchList.find((b: any) => b.name === 'IT Campus')

  // 3. Binolar (Buildings)
  if (chilanzar) {
    const buildings = ['A Bino', 'B Bino', 'C Bino']
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

  if (itCampus) {
    const buildings = ['Main IT Building', 'Dormitory', 'Innovation Center']
    for (const name of buildings) {
      const existing = await prisma.building.findFirst({
        where: { name, branchId: itCampus.id }
      })
      if (!existing) {
        await prisma.building.create({
          data: { name, branchId: itCampus.id }
        })
      }
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
