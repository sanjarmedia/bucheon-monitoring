const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10)
  const updated = await prisma.user.update({
    where: { email: 'admin@test.com' },
    data: { password: hashedPassword }
  })
  console.log('Updated user:', updated.email, 'password set to admin')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
