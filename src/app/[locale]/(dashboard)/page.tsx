import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Ticket, Users, AlertCircle, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const t = await getTranslations('Index')
  const sidebar = await getTranslations('Sidebar')
  
  let totalItems = 0, activeEmployees = 0, openTickets = 0, itemsInRepair = 0, totalBranches = 0;
  
  try {
    [totalItems, activeEmployees, openTickets, itemsInRepair, totalBranches] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.user.count({ where: { NOT: { role: 'SUPER_ADMIN' } } }),
      prisma.ticket.count({ where: { status: { in: ['NEW', 'IN_PROGRESS'] } } }),
      prisma.inventoryItem.count({ where: { status: 'IN_REPAIR' } }),
      prisma.branch.count()
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
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{sidebar('dashboard')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
            Chart Placeholder
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('recent_activity')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
            Activity List Placeholder
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
