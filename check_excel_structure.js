const xlsx = require('xlsx')
const wb = xlsx.readFile('Full information tech - BUCHEON UNIVERSITY (6).xlsx')

const sheets = ['Invertar texnika CHILANZAR 2026', 'Invertar texnika ITCAMPUS 2026', 'Texnikum spisok']

sheets.forEach(s => {
  const ws = wb.Sheets[s]
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, range: 0, raw: false })
  console.log(`--- ${s} (First 10 rows) ---`)
  rows.slice(0, 10).forEach(r => console.log(r))
})
