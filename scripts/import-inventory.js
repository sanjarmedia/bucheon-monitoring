/**
 * Excel'dagi "Общий список оборудование" varag'idan yagona baza quradi:
 *  - Lokatsiyalar va inventar TO'LIQ tozalanadi, keyin Exceldan qayta quriladi
 *  - IT Campus -> IT Bino (-1..6 qavat + 99 "Umumiy")
 *  - Chilonzor -> A Blok, B Blok (qavatlar ma'lumotdan), umumiy joylar A Blok 99-qavatga
 *  - Xona raqami joylashuv matnidan: "411 Multimedia" -> IT 4-qavat; "А-301" -> A Blok 3-qavat
 *  - Kategoriya jihoz nomidan aniqlanadi
 */
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SHEET = "Общий список оборудование";

// ---------- Kategoriya aniqlash ----------
const CATEGORY_RULES = [
  { name: "Kamera", re: /(видеокамера|камера|camera|hikvision|dahua|ptz|видеонабл)/i },
  { name: "Printer va skaner", re: /(принтер|printer|мфу|копир|сканер|scanner|bizhub|accurioprint|плоттер|переплат|переплёт|ламинатор)/i },
  { name: "Proyektor", re: /(проектор|projector|epson eb|экран для проектора)/i },
  { name: "Monitor va ekran", re: /(монитор|monitor|дисплей|display|led модуль|панель|interactive flat|touch screen|телевизор|tv )/i },
  { name: "Kompyuter va noutbuk", re: /(ноутбук|notebook|laptop|asus|acer aspire|lenovo|macbook|компьютер|моноблок|optiplex|all ?-? ?in ?-? ?one|системный блок|процессор|материнск)/i },
  { name: "Audio va video", re: /(микрофон|аккустическ|акустическ|колонк|спикер|speaker|саундбар|звук|аудио|audio|softbox|софтбокс|godox|amaran|объектив|штатив|stabilizator|стабилизатор|петличн)/i },
  { name: "Tarmoq jihozi", re: /(коммутатор|switch|роутер|router|точка доступа|access point|wi-?fi|sfp|ethernet|сетев|patch|патч|кабель utp|модем)/i },
  { name: "Server va UPS", re: /(сервер|server|ибп|ups|hdd|ssd|жесткий диск|накопитель|raid|стойка|rack)/i },
  { name: "Aksesuar va kabel", re: /(кабель|cable|адаптер|adapter|переходник|зарядн|мышь|mouse|клавиатура|keyboard|сумка|флешка|usb|hdmi|кронштейн|батаре)/i },
];
function detectCategory(name) {
  for (const r of CATEGORY_RULES) if (r.re.test(name)) return r.name;
  return "Boshqa texnika";
}

// ---------- Yordamchi ----------
function parseCost(v) {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? null : n;
}
function parseDate(v) {
  if (!v) return null;
  const m = String(v).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return isNaN(d.getTime()) ? null : d;
}
// IT: "411 Multimedia" -> {floor:4, room:"411 Multimedia"}; aniqlanmasa floor 99
function parseItLocation(loc) {
  const m = loc.match(/^(\d{3})/);
  if (m) {
    const f = +m[1][0];
    if (f >= 1 && f <= 6) return { floor: f, room: loc };
  }
  if (/^[BБ]-?\s?0?\d/i.test(loc)) return { floor: -1, room: loc }; // B-01 podval
  return { floor: 99, room: loc };
}
// Chilonzor: "А-301 (операторская)" -> A Blok 3-qavat
function parseChLocation(loc) {
  let m = loc.match(/^[АA]\s*-?\s*(\d{3})/i);
  if (m) return { block: "A Blok", floor: +m[1][0], room: loc };
  m = loc.match(/^[ВB]\s*-?\s*(\d{3})/i);
  if (m) return { block: "B Blok", floor: +m[1][0], room: loc };
  return { block: "A Blok", floor: 99, room: loc };
}

async function main() {
  // ---------- Excel o'qish ----------
  const root = path.join(__dirname, "..");
  const xlsxFile = fs.readdirSync(root).find(f => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"));
  if (!xlsxFile) throw new Error("Loyiha papkasida .xlsx topilmadi");
  console.log("O'qilmoqda:", xlsxFile);

  const wb = xlsx.readFile(path.join(root, xlsxFile));
  const ws = wb.Sheets[SHEET];
  if (!ws) throw new Error(`"${SHEET}" varaq topilmadi`);
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: null });

  // ---------- Tozalash ----------
  console.log("Eski ma'lumotlar tozalanmoqda...");
  await prisma.inventoryHistory.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.ticket.updateMany({ where: { roomId: { not: null } }, data: { roomId: null } });
  await prisma.user.updateMany({ where: { roomId: { not: null } }, data: { roomId: null } });
  await prisma.roomHistory.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.attendanceLog.deleteMany({});
  await prisma.turnstile.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.branch.deleteMany({});

  // ---------- Struktura ----------
  console.log("Filial/bino/qavatlar yaratilmoqda...");
  const it = await prisma.branch.create({
    data: { name: "IT Campus", buildings: { create: [{ name: "IT Bino" }] } },
    include: { buildings: true }
  });
  const ch = await prisma.branch.create({
    data: { name: "Chilonzor", buildings: { create: [{ name: "A Blok" }, { name: "B Blok" }] } },
    include: { buildings: true }
  });
  const itBino = it.buildings[0];
  const aBlok = ch.buildings.find(b => b.name === "A Blok");
  const bBlok = ch.buildings.find(b => b.name === "B Blok");

  const floorCache = new Map(); // "buildingId:number" -> floorId
  async function getFloor(buildingId, number) {
    const key = `${buildingId}:${number}`;
    if (!floorCache.has(key)) {
      const f = await prisma.floor.create({ data: { buildingId, number } });
      floorCache.set(key, f.id);
    }
    return floorCache.get(key);
  }
  // IT bino doimiy qavatlari
  for (const n of [-1, 0, 1, 2, 3, 4, 5, 6]) await getFloor(itBino.id, n);

  const roomCache = new Map(); // "floorId:number" -> roomId
  async function getRoom(floorId, number) {
    const key = `${floorId}:${number}`;
    if (!roomCache.has(key)) {
      const r = await prisma.room.create({ data: { floorId, number } });
      roomCache.set(key, r.id);
    }
    return roomCache.get(key);
  }

  // ---------- Kategoriyalar ----------
  const catNames = [...new Set([...CATEGORY_RULES.map(r => r.name), "Boshqa texnika"])];
  const catMap = new Map();
  for (const name of catNames) {
    let c = await prisma.category.findFirst({ where: { name } });
    if (!c) c = await prisma.category.create({ data: { name } });
    catMap.set(name, c.id);
  }

  // ---------- Qatorlarni qayta ishlash ----------
  console.log("Jihozlar tayyorlanmoqda...");
  const items = [];
  const seenInv = new Map(); // invNumber -> count
  let skipped = 0;

  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const name = r[1] ? String(r[1]).trim() : null;
    if (!name) { skipped++; continue; }

    let invNum = r[4] ? String(r[4]).trim() : null;
    if (invNum) {
      const c = seenInv.get(invNum) || 0;
      seenInv.set(invNum, c + 1);
      if (c > 0) invNum = `${invNum}-${c + 1}`; // takror bo'lsa suffiks
    }

    const itLoc = r[8] ? String(r[8]).trim() : null;
    const chLoc = r[9] ? String(r[9]).trim() : null;

    let roomId = null;
    if (itLoc) {
      const { floor, room } = parseItLocation(itLoc);
      roomId = await getRoom(await getFloor(itBino.id, floor), room);
    } else if (chLoc) {
      const { block, floor, room } = parseChLocation(chLoc);
      const bld = block === "B Blok" ? bBlok : aBlok;
      roomId = await getRoom(await getFloor(bld.id, floor), room);
    }

    items.push({
      name,
      inventoryNumber: invNum,
      cost: parseCost(r[7]),
      purchaseDate: parseDate(r[2]),
      status: "ACTIVE",
      categoryId: catMap.get(detectCategory(name)),
      roomId,
    });
  }

  // ---------- Saqlash (bo'laklab) ----------
  console.log(`${items.length} ta jihoz bazaga yozilmoqda...`);
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < items.length; i += CHUNK) {
    const res = await prisma.inventoryItem.createMany({ data: items.slice(i, i + CHUNK) });
    written += res.count;
    console.log(`  ${written}/${items.length}`);
  }

  const roomCount = roomCache.size;
  console.log("");
  console.log("================== NATIJA ==================");
  console.log(`Jihozlar:       ${written} ta yozildi (${skipped} bo'sh qator tashlandi)`);
  console.log(`Xonalar:        ${roomCount} ta yaratildi`);
  console.log(`Filiallar:      IT Campus (IT Bino, -1..6 qavat), Chilonzor (A/B Blok)`);
  console.log(`Umumiy joylar:  99-"qavat"da (kutubxona, otdel va h.k.)`);
  console.log("============================================");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
