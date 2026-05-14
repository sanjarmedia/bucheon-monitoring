import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Ticket, Users, AlertCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const t = await getTranslations('Index')
  const sidebar = await getTranslations('Sidebar')
  
  let totalItems = 0, activeEmployees = 0, openTickets = 0, itemsInRepair = 0;
  
  try {
    [totalItems, activeEmployees, openTickets, itemsInRepair] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.user.count({ where: { NOT: { role: 'SUPER_ADMIN' } } }),
      prisma.ticket.count({ where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }),
      prisma.inventoryItem.count({ where: { status: 'IN_REPAIR' } })
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

  // Fetch recent activity
  const [invHistory, ticketHistory] = await Promise.all([
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
            <Card key={i} className="hover:shadow-lg transition-shadow border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
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
        <Card className="col-span-4 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-secondary/20 dark:from-card dark:to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> {t('active_tickets')} Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <div className="h-[300px] w-full px-4">
               <div className="flex items-end justify-between h-full gap-2 pb-6">
                 {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                   <div key={i} className="flex-1 bg-primary/20 rounded-t-lg relative group transition-all hover:bg-primary/40" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-orange-500" /> {t('recent_activity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-3 py-1">
                  <div className="space-y-1">
                    <div className="text-xs font-bold">{act.title}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{act.desc}</div>
                    <div className="text-[9px] font-mono opacity-50">{act.time.toLocaleTimeString()}</div>
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
