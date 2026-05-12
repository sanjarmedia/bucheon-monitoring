const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.category.findMany().then(c => {
  console.log('Categories in DB:')
  c.forEach(cat => console.log(`- "${cat.name}" (ID: ${cat.id})`))
}).finally(() => p.$disconnect())
