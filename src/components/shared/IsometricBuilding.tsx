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
  "#F39C12",
  "#3498db",
  "#2ecc71",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
]

import { useTranslations } from "next-intl"

export function IsometricBuilding({ building, categories = [] }: { building: BuildingData, categories?: any[] }) {
  const router = useRouter()
  const t = useTranslations('Locations')
  const roomsT = useTranslations('Rooms')
  const common = useTranslations('Common')

  const [activeFloor, setActiveFloor] = useState<number | null>(null)
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null)

  // Sort floors ascending, then display top floor first (like a real building)
  const floors = [...building.floors].sort((a, b) => a.number - b.number)
  const displayFloors = [...floors].slice().reverse()

  const floorLabel = (floor: Floor) =>
    floor.number === 99 ? t('outside') : `${floor.number}-${t('floor')}`

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* 2D Building: stacked floor list */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">{building.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {floors.length} {t('floor')}
            </span>
          </div>

          <div className="space-y-1.5">
            {displayFloors.map((floor) => {
              const idx = floors.findIndex(f => f.id === floor.id)
              const color = FLOOR_COLORS[idx % FLOOR_COLORS.length]
              const isActive = activeFloor === idx
              const totalInv = floor.rooms.reduce((acc, r) => acc + (r._count?.inventory || 0), 0)
              const totalTickets = floor.rooms.reduce((acc, r) => acc + (r._count?.tickets || 0), 0)

              return (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(isActive ? null : idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                    isActive
                      ? "border-transparent shadow-md text-white"
                      : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40"
                  }`}
                  style={isActive ? { background: color } : undefined}
                >
                  <span
                    className="h-8 w-1.5 rounded-full shrink-0"
                    style={{ background: isActive ? "rgba(255,255,255,0.6)" : color }}
                  />
                  <Layers className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">
                      {floorLabel(floor)}
                      {floor.rooms[0]?.faculty && (
                        <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${
                          isActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                        }`}>
                          {floor.rooms[0].faculty}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                      {floor.rooms.length} {t('roomNumber')} · {totalInv} {roomsT('totalInventory').toLowerCase()}
                      {totalTickets > 0 && (
                        <span className={isActive ? "text-white" : "text-orange-500"}> · {totalTickets} {roomsT('activeTickets').toLowerCase()}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive ? "rotate-90 text-white" : "text-muted-foreground/40"
                  }`} />
                </button>
              )
            })}

            {floors.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">{t('noFloors')}</p>
            )}
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
                style={{ background: FLOOR_COLORS[activeFloor % FLOOR_COLORS.length] }}
              >
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Layers className="h-5 w-5" />
                  {floors[activeFloor] && floorLabel(floors[activeFloor])}
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
