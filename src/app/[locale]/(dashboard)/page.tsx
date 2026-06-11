import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Ticket, Users, AlertCircle, Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const t = await getTranslations('Index')
  const sidebar = await getTranslations('Sidebar')
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
  const weekStart = last7Days[0]

  // BARCHA so'rovlar bitta parallel blokda — baza uzoq serverda, har ketma-ketlik qimmat
  let totalItems = 0, activeEmployees = 0, openTickets = 0, itemsInRepair = 0
  let weekTickets: { createdAt: Date }[] = []
  let invHistory: any[] = [], ticketHistory: any[] = []

  try {
    [totalItems, activeEmployees, openTickets, itemsInRepair, weekTickets, invHistory, ticketHistory] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.user.count({ where: { NOT: { role: 'SUPER_ADMIN' } } }),
      prisma.ticket.count({ where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }),
      prisma.inventoryItem.count({ where: { status: 'IN_REPAIR' } }),
      prisma.ticket.findMany({
        where: { createdAt: { gte: weekStart } },
        select: { createdAt: true }
      }),
      prisma.inventoryHistory.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { item: true }
      }),
      prisma.ticketHistory.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { ticket: true }
      })
    ])
  } catch (error) {
    console.error("Dashboard stats error:", error)
  }

  const stats = [
    { title: t('total_items'), value: totalItems.toString(), icon: Package, description: "All hardware items" },
    { title: sidebar('employees'), value: activeEmployees.toString(), icon: Users, description: "Registered staff members" },
    { title: t('active_tickets'), value: openTickets.toString(), icon: Ticket, description: "Unresolved support tickets" },
    { title: "Items in Repair", value: itemsInRepair.toString(), icon: AlertCircle, description: "Hardware requiring maintenance" }
  ]

  // Haftalik grafik: bitta so'rov natijasini JS'da kunlarga taqsimlaymiz
  const chartData = last7Days.map((date) => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    const count = weekTickets.filter(tk => tk.createdAt >= date && tk.createdAt < nextDay).length
    return { date: date.toLocaleDateString('uz-UZ', { weekday: 'short' }), count }
  })

  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  const recentActivity = [...invHistory.map(h => ({
    id: h.id,
    type: 'INVENTORY',
    title: h.item.name,
    desc: h.description,
    time: h.createdAt
  })), ...ticketHistory.map(h => ({
    id: h.id,
    type: 'TICKET',
    title: h.ticket.category,
    desc: h.ticket.description,
    time: h.createdAt
  }))].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{sidebar('dashboard')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('title')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="hover:shadow-lg transition-all border-none shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-70">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary group-hover:scale-125 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> {t('active_tickets')} {t('trends') || "Trends"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <div className="h-[300px] w-full px-6">
               <div className="flex items-end justify-between h-full gap-3 pb-8">
                 {chartData.map((d, i) => {
                   const height = (d.count / maxCount) * 100
                   return (
                     <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                       <div 
                         className="w-full bg-primary/20 rounded-t-lg relative group transition-all hover:bg-primary/50 cursor-pointer" 
                         style={{ height: `${Math.max(height, 5)}%` }}
                       >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20">
                            {d.count}
                          </div>
                       </div>
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.date}</span>
                     </div>
                   )
                 })}
               </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-xl bg-white/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-orange-500" /> {t('recent_activity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-4 border-l-2 border-primary/20 pl-4 py-1 hover:border-primary transition-colors group">
                  <div className="space-y-1">
                    <div className="text-sm font-bold group-hover:text-primary transition-colors">{act.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{act.desc}</div>
                    <div className="text-[10px] font-mono opacity-50 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-20 text-muted-foreground italic text-sm">
                   {t('no_activity') || "Harakatlar mavjud emas"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
