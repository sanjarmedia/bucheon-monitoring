"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { DoorOpen, Layers, Building2, ChevronRight } from "lucide-react"

interface Room {
  id: string
  number: string
  faculty: string | null
  inventory?: { categoryId: string }[]
  _count?: { inventory: number; tickets: number }
}

interface Floor {
  id: string
  number: number
  rooms: Room[]
}

interface BuildingData {
  id: string
  name: string
  floors: Floor[]
}

const FLOOR_COLORS = [
  { base: "#F39C12", top: "#FFB300", side: "#E67E22", text: "#fff" },
  { base: "#3498db", top: "#5DADE2", side: "#2980B9", text: "#fff" },
  { base: "#2ecc71", top: "#58D68D", side: "#27AE60", text: "#fff" },
  { base: "#9b59b6", top: "#BB8FCE", side: "#8E44AD", text: "#fff" },
  { base: "#e74c3c", top: "#F1948A", side: "#C0392B", text: "#fff" },
  { base: "#1abc9c", top: "#48C9B0", side: "#17A589", text: "#fff" },
]

import { useTranslations } from "next-intl"

export function IsometricBuilding({ building, categories = [] }: { building: BuildingData, categories?: any[] }) {
  const router = useRouter()
  const t = useTranslations('Locations')
  const roomsT = useTranslations('Rooms')
  const common = useTranslations('Common')
  
  const [activeFloor, setActiveFloor] = useState<number | null>(null)
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null)

  // Sort floors ascending
  const floors = [...building.floors].sort((a, b) => a.number - b.number)
  const totalFloors = floors.length

  // Isometric box dimensions
  const W = 300   // width of each floor block
  const H = 40    // height of each floor block
  const D = 120   // depth (side face height)
  const ISO_X = 0.5  // cosine 60deg
  const ISO_Y = 0.25 // sin ~15deg

  const svgWidth = W + 200
  const svgHeight = totalFloors * (H + D * 0.4) + 180
  const startX = 100
  const startY = svgHeight - 60

  // Convert iso coords to screen coords
  const iso = (gx: number, gy: number, gz: number) => ({
    x: startX + (gx - gy) * ISO_X * (W / 2),
    y: startY - gz * (H + 12) - (gx + gy) * ISO_Y * (W / 2),
  })

  const selectedFloor = activeFloor !== null ? floors.find(f => f.id === floors[activeFloor]?.id) : null

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* 3D Isometric Building */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-white/70 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-medium text-white">{building.name}</span>
            <span className="ml-auto text-xs opacity-50">{common('search')}</span>
          </div>

          <div className="flex justify-center overflow-hidden">
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="select-none"
              style={{ maxWidth: "100%", height: "auto" }}
            >
              {/* Ground shadow */}
              <ellipse
                cx={startX + (W / 2) * ISO_X * 1}
                cy={startY + 10}
                rx={W * 0.42}
                ry={20}
                fill="rgba(0,0,0,0.3)"
              />

              {/* Draw floors from bottom to top */}
              {floors.map((floor, idx) => {
                const color = FLOOR_COLORS[idx % FLOOR_COLORS.length]
                const isActive = activeFloor === idx
                const gz = idx

                // 8 corners of the isometric box
                const p = {
                  frontLeft:  iso(0, 0, gz),
                  frontRight: iso(1, 0, gz),
                  backLeft:   iso(0, 1, gz),
                  backRight:  iso(1, 1, gz),
                  topFrontLeft:  iso(0, 0, gz + 1),
                  topFrontRight: iso(1, 0, gz + 1),
                  topBackLeft:   iso(0, 1, gz + 1),
                  topBackRight:  iso(1, 1, gz + 1),
                }

                const topFace = `${p.topFrontLeft.x},${p.topFrontLeft.y} ${p.topFrontRight.x},${p.topFrontRight.y} ${p.topBackRight.x},${p.topBackRight.y} ${p.topBackLeft.x},${p.topBackLeft.y}`
                const leftFace = `${p.frontLeft.x},${p.frontLeft.y} ${p.topFrontLeft.x},${p.topFrontLeft.y} ${p.topBackLeft.x},${p.topBackLeft.y} ${p.backLeft.x},${p.backLeft.y}`
                const rightFace = `${p.frontRight.x},${p.frontRight.y} ${p.topFrontRight.x},${p.topFrontRight.y} ${p.topFrontLeft.x},${p.topFrontLeft.y} ${p.frontLeft.x},${p.frontLeft.y}`

                const scale = isActive ? 1.02 : 1
                const centerX = (p.frontLeft.x + p.backRight.x) / 2
                const centerY = (p.frontLeft.y + p.topBackRight.y) / 2

                return (
                  <g
                    key={floor.id}
                    onClick={() => setActiveFloor(isActive ? null : idx)}
                    style={{ cursor: "pointer", transform: `scale(${scale})`, transformOrigin: `${centerX}px ${centerY}px`, transition: "transform 0.2s ease" }}
                  >
                    {/* Left face */}
                    <polygon
                      points={leftFace}
                      fill={isActive ? color.side : `${color.side}cc`}
                      stroke={isActive ? "#fff" : "rgba(255,255,255,0.1)"}
                      strokeWidth={isActive ? 1.5 : 0.5}
                    />
                    {/* Right face */}
                    <polygon
                      points={rightFace}
                      fill={isActive ? color.base : `${color.base}cc`}
                      stroke={isActive ? "#fff" : "rgba(255,255,255,0.1)"}
                      strokeWidth={isActive ? 1.5 : 0.5}
                    />
                    {/* Top face */}
                    <polygon
                      points={topFace}
                      fill={isActive ? color.top : `${color.top}99`}
                      stroke={isActive ? "#fff" : "rgba(255,255,255,0.15)"}
                      strokeWidth={isActive ? 1.5 : 0.5}
                    />

                    {/* Floor label on top */}
                    <text
                      x={(p.topFrontLeft.x + p.topBackRight.x) / 2}
                      y={(p.topFrontLeft.y + p.topBackRight.y) / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isActive ? "#fff" : "rgba(255,255,255,0.6)"}
                      fontSize={isActive ? "11" : "9"}
                      fontWeight={isActive ? "bold" : "normal"}
                      style={{ pointerEvents: "none" }}
                    >
                      {floor.number}-{t('floor')}{floor.rooms[0]?.faculty ? ` (${floor.rooms[0].faculty})` : ''} • {floor.rooms.length} {t('roomNumber')}
                    </text>

                    {/* Active indicator glow */}
                    {isActive && (
                      <polygon
                        points={topFace}
                        fill="rgba(255,255,255,0.15)"
                        stroke="#fff"
                        strokeWidth={2}
                        style={{ animation: "pulse 1.5s ease-in-out infinite" }}
                      />
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            {floors.map((floor, idx) => {
              const color = FLOOR_COLORS[idx % FLOOR_COLORS.length]
              return (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(activeFloor === idx ? null : idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFloor === idx ? "ring-2 ring-white scale-105" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ background: color.base, color: color.text }}
                >
                  <Layers className="h-3 w-3" /> {floor.number}-{t('floor')}{floor.rooms[0]?.faculty ? ` (${floor.rooms[0].faculty})` : ''}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right side: Rooms panel */}
        <div className="space-y-4">
          {activeFloor === null ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card border rounded-2xl text-muted-foreground gap-3">
              <Building2 className="h-12 w-12 opacity-20" />
              <p className="text-sm">{common('no_data')}</p>
            </div>
          ) : (
            <div className="bg-card border rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-right-4 duration-300">
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ background: FLOOR_COLORS[activeFloor % FLOOR_COLORS.length].base }}
              >
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Layers className="h-5 w-5" />
                  {floors[activeFloor]?.number}-{t('floor')}
                  {floors[activeFloor]?.rooms[0]?.faculty && (
                    <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded-full ml-2">
                      {floors[activeFloor]?.rooms[0]?.faculty}
                    </span>
                  )}
                </div>
                <span className="text-white/70 text-sm">{floors[activeFloor]?.rooms.length} {t('roomNumber')}</span>
              </div>

              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {floors[activeFloor]?.rooms.length === 0 ? (
                  <p className="col-span-3 text-center text-muted-foreground text-sm py-8">{common('no_data')}</p>
                ) : (
                  floors[activeFloor]?.rooms.map(room => (
                    <button
                      key={room.id}
                      onMouseEnter={() => setHoveredRoom(room.id)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      onClick={() => router.push(`/locations/rooms/${room.id}` as any)}
                      className={`group flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200 ${
                        hoveredRoom === room.id
                          ? "border-primary bg-primary/10 shadow-md scale-105"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <DoorOpen className={`h-4 w-4 shrink-0 transition-colors ${hoveredRoom === room.id ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-sm truncate">{room.number}</span>
                        <ChevronRight className={`h-3 w-3 ml-auto transition-all ${hoveredRoom === room.id ? "translate-x-1 text-primary" : "text-muted-foreground/30"}`} />
                      </div>
                      {room.faculty && (
                        <span className="text-[10px] text-muted-foreground truncate w-full pl-5">{room.faculty}</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Floor Statistics */}
              <div className="border-t bg-muted/30 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                   <Layers className="h-3 w-3" /> {t('floor')} {common('statistics')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" /> {roomsT('totalInventory')}
                        </span>
                        <span className="font-bold">
                          {floors[activeFloor]?.rooms.reduce((acc, r) => acc + (r._count?.inventory || 0), 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Cameras</span>
                        <span className="font-medium">
                           {floors[activeFloor]?.rooms.reduce((acc, r) => {
                             const camCat = categories.find(c => c.name.toLowerCase().includes('камера') || c.name.toLowerCase().includes('camera'))
                             return acc + (r.inventory?.filter(i => i.categoryId === camCat?.id).length || 0)
                           }, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Network (WiFi/Router)</span>
                        <span className="font-medium">
                           {floors[activeFloor]?.rooms.reduce((acc, r) => {
                             const netCat = categories.find(c => c.name.toLowerCase().includes('сеть') || c.name.toLowerCase().includes('tarmoq') || c.name.toLowerCase().includes('network'))
                             return acc + (r.inventory?.filter(i => i.categoryId === netCat?.id).length || 0)
                           }, 0)}
                        </span>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <DoorOpen className="h-4 w-4" /> {roomsT('activeTickets')}
                        </span>
                        <span className="font-bold text-orange-500">
                          {floors[activeFloor]?.rooms.reduce((acc, r) => acc + (r._count?.tickets || 0), 0)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground italic">
                           {floors[activeFloor]?.rooms.reduce((acc, r) => acc + (r._count?.tickets || 0), 0) > 0 
                             ? "Problemlar bartaraf etilmoqda..." 
                             : "Hozircha muammolar yo'q."}
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
