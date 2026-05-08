const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const cats = await prisma.category.findMany()
  console.log('Existing categories:', JSON.stringify(cats.map(c => ({ id: c.id, name: c.name })), null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
