const xlsx = require('xlsx')
const wb = xlsx.readFile('Full information tech - BUCHEON UNIVERSITY (6).xlsx')

const sheets = ['Invertar texnika CHILANZAR 2026', 'Invertar texnika ITCAMPUS 2026', 'Texnikum spisok']

const locations = {}

sheets.forEach(s => {
  const ws = wb.Sheets[s]
  const rows = xlsx.utils.sheet_to_json(ws, { raw: false })
  locations[s] = new Set()
  rows.forEach(row => {
    let loc = null
    if (s === 'Invertar texnika CHILANZAR 2026') loc = row['Местоположение']
    if (s === 'Invertar texnika ITCAMPUS 2026') loc = row['__EMPTY_6']
    if (s === 'Texnikum spisok') loc = row['местолоположение']
    
    if (loc) locations[s].add(String(loc).trim())
  })
})

for (const s in locations) {
  console.log(`--- ${s} ---`)
  console.log(Array.from(locations[s]).sort())
}
