import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Search, CheckCircle2, Clock, AlertCircle, MapPin } from "lucide-react"
import { createTicket, resolveTicket } from "@/lib/actions/tickets"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default async function RequestsPage({
  searchParams
}: {
  searchParams: { q?: string, status?: string, priority?: string, faculty?: string }
}) {
  const t = await getTranslations("Tickets")
  const common = await getTranslations("Common")
  const inv = await getTranslations("Inventory")
  
  const whereClause: any = {}
  if (searchParams.status && searchParams.status !== "ALL") whereClause.status = searchParams.status
  if (searchParams.priority && searchParams.priority !== "ALL") whereClause.priority = searchParams.priority
  if (searchParams.q) {
    whereClause.OR = [
      { description: { contains: searchParams.q } },
      { category: { contains: searchParams.q } }
    ]
  }

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      createdBy: true,
      assignedTo: true,
      room: {
        include: { floor: { include: { building: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const rooms = await prisma.room.findMany({
    include: { floor: { include: { building: true } } }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="gap-2 shadow-lg hover:scale-105 transition-transform" />}>
            <Plus className="h-4 w-4" /> {t('newTicket')}
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('createTicket')}</DialogTitle>
              <DialogDescription>
                {t('provideDetails')}
              </DialogDescription>
            </DialogHeader>
            <form action={createTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select name="category" required>
                    <SelectTrigger><SelectValue placeholder={t('choose')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRINTER_ISSUE">PRINTER ISSUE</SelectItem>
                      <SelectItem value="PROJECTOR_ISSUE">PROJECTOR ISSUE</SelectItem>
                      <SelectItem value="NETWORK_ISSUE">NETWORK/WIFI</SelectItem>
                      <SelectItem value="HARDWARE_REQUEST">NEW DEVICE</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">{t('priority')}</Label>
                  <Select name="priority" defaultValue="NORMAL">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">LOW</SelectItem>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                      <SelectItem value="URGENT">URGENT!</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">{t('roomLocation')}</Label>
                <Select name="roomId" required>
                  <SelectTrigger><SelectValue placeholder={t('choose')} /></SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.number} ({room.faculty || room.floor.building.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Input id="description" name="description" placeholder={t('description')} required />
              </div>
              
              <DialogFooter>
                <Button type="submit" className="w-full">{t('sendTelegram')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">{t('total')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-100">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'NEW').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">{t('resolved')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'COMPLETED').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100 text-center flex flex-col justify-center cursor-pointer hover:bg-purple-100 transition-colors">
          <Link href="/reports" className="p-4">
            <div className="text-sm font-medium text-purple-700">{t('analyticsLink')}</div>
          </Link>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('listTitle')}</CardTitle>
              <CardDescription>{t('listSubtitle')}</CardDescription>
            </div>
            <form className="flex gap-2">
               <Input name="q" placeholder={common('search')} className="w-64" defaultValue={searchParams.q} />
               <Button type="submit" size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/20">
                <TableHead>{t('catId')}</TableHead>
                <TableHead>{inv('details')}</TableHead>
                <TableHead>{t('statusPriority')}</TableHead>
                <TableHead>{inv('room')}</TableHead>
                <TableHead>{t('staff')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead className="text-right">{common('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-secondary/10 transition-colors">
                  <TableCell>
                    <div className="font-bold text-primary">{ticket.category.replace("_", " ")}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{ticket.id.slice(-8)}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm line-clamp-2">{ticket.description}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={ticket.status === 'NEW' ? 'default' : ticket.status === 'IN_PROGRESS' ? 'secondary' : ticket.status === 'COMPLETED' ? 'outline' : 'destructive'}>
                        {ticket.status}
                      </Badge>
                      <span className={`text-[10px] font-bold ${ticket.priority === 'URGENT' ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {ticket.room?.number} ({ticket.room?.faculty || 'N/A'})
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium">{ticket.createdBy.fullName}</div>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {ticket.status !== 'COMPLETED' && (
                      <Dialog>
                        <DialogTrigger render={<Button size="sm" variant="outline" className="text-xs">{t('close')}</Button>} />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('completeTicket')}</DialogTitle>
                            <DialogDescription>{t('resolutionDesc')}</DialogDescription>
                          </DialogHeader>
                          <form action={resolveTicket} className="space-y-4">
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <div className="space-y-2">
                              <Label>{t('resolutionComment')}</Label>
                              <Input name="resolutionComment" placeholder={t('resolutionComment')} required />
                            </div>
                            <DialogFooter>
                              <Button type="submit">{t('closeTelegram')}</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {common('no_data')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
