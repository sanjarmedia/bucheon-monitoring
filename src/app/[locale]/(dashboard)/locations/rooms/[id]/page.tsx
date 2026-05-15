import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, User, Video, ShieldAlert, Package, Clock, History, CalendarDays, Ticket } from "lucide-react"
import { updateRoomDetails } from "@/lib/actions/locations"
import { Link } from "@/i18n/routing"
import { RoomInventoryManager } from "@/components/shared/RoomInventoryManager"
import { Toaster } from "@/components/ui/toaster"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default async function RoomDetailsPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      floor: {
        include: { building: { include: { branch: true } } }
      },
      responsible: true,
      inventory: {
        include: { category: true }
      },
      tickets: {
        include: { createdBy: true, assignedTo: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      history: {
        include: { room: true },
        orderBy: { createdAt: 'desc' },
      }
    }
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  const t = await getTranslations('Rooms')
  const loc = await getTranslations('Locations')
  const inv = await getTranslations('Inventory')
  const common = await getTranslations('Common')

  if (!room) {
    notFound()
  }

  const locationString = `${room.floor.building.branch.name} > ${room.floor.building.name} > ${room.floor.number}-qavat`

  // Stats
  const inventoryCount = room.inventory.length
  const activeTickets = room.tickets.filter(t => t.status === "NEW" || t.status === "IN_PROGRESS").length

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    IN_REPAIR: "bg-amber-100 text-amber-800 border-amber-200",
    WRITTEN_OFF: "bg-red-100 text-red-800 border-red-200",
  }

  const historyIcons: Record<string, string> = {
    CREATED: "🏠",
    RESPONSIBLE_CHANGED: "👤",
    INVENTORY_ADDED: "📦",
    INVENTORY_REMOVED: "📤",
    FACULTY_CHANGED: "🏷️",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${loc('floor')} ${room.floor.number} | ${room.number} ${t('details')}`}
        description={`${room.floor.building.branch.name} - ${room.floor.building.name}`}
        showBackButton
      >
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              <History className="h-4 w-4 mr-2" /> {t('history')}
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('history')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {room.history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('noHistory')}</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-primary/20 space-y-4">
                    {room.history.map(h => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-[8px]">
                          {historyIcons[h.action] || "📝"}
                        </div>
                        <div className="bg-card border rounded-lg p-3">
                          <p className="text-sm font-medium">{h.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(h.createdAt).toLocaleDateString(locale)} {new Date(h.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {h.performedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {h.performedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalInventory')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryCount}</div>
            <p className="text-xs text-muted-foreground">{t('activeTickets')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold truncate">{room.responsible?.fullName || common('no_data')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('responsiblePerson')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {room.responsibleSince
                  ? new Date(room.responsibleSince).toLocaleDateString(locale)
                  : "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('responsibleSince')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ROOM DETAILS FORM */}
        <Card>
          <CardHeader>
            <CardTitle>{loc('faculty')}</CardTitle>
            <CardDescription>{t('details')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateRoomDetails} className="space-y-4">
              <input type="hidden" name="roomId" value={room.id} />
              
              <div className="space-y-2">
                <Label htmlFor="faculty">{loc('faculty')}</Label>
                <Input 
                  id="faculty" 
                  name="faculty" 
                  defaultValue={room.faculty || ""} 
                  placeholder={loc('faculty')} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('responsiblePerson')}</Label>
                <div className="flex gap-2 items-center p-3 bg-secondary/50 rounded-lg">
                   <User className="h-4 w-4 text-primary" />
                   <span className="text-sm font-medium">
                     {room.responsible ? room.responsible.fullName : common('no_data')}
                   </span>
                </div>
              </div>
              
              <Button type="submit">{common('save')}</Button>
            </form>
          </CardContent>
        </Card>

        {/* CCTV PLACEHOLDER */}
        <Card className="bg-black text-white border-zinc-800 relative overflow-hidden flex items-center justify-center min-h-[250px]">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Video className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">Cam 01 - {loc('floor')} {room.floor.number} | {room.number}</span>
          </div>
          <div className="text-center text-zinc-600">
            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('cctv')} — {common('no_data')}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* INVENTORY LIST */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t('inventory')}
              </div>
              <RoomInventoryManager roomId={room.id} categories={categories.map(c => ({ id: c.id, name: c.name }))} />
            </CardTitle>
            <CardDescription>{t('totalInventory')}: {inventoryCount}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{inv('name')}</TableHead>
                  <TableHead>{inv('category')}</TableHead>
                  <TableHead>{common('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {room.inventory.map((item, i) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/inventory/${item.id}`} className="hover:underline text-primary">
                        {item.name}
                      </Link>
                      {item.inventoryNumber && (
                        <div className="text-[10px] text-muted-foreground font-mono">INV: {item.inventoryNumber}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {room.inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {common('no_data')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {t('lastTickets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {room.tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-2 opacity-10" />
                  <p>{common('no_data')}</p>
                </div>
              ) : (
                room.tickets.map(ticket => (
                  <div key={ticket.id} className="flex items-start justify-between p-3 border rounded-lg bg-secondary/10">
                    <div>
                      <p className="font-medium">{ticket.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.createdBy.fullName} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{ticket.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
