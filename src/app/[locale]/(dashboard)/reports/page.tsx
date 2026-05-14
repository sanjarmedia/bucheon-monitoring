import { TicketService } from "@/services/TicketService"
import { TicketAnalyticsCharts } from "@/components/shared/TicketCharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, Info, TrendingUp, Users, MapPin } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { InventoryService } from "@/services/InventoryService"
import { prisma } from "@/lib/prisma"

export default async function ReportsPage() {
  const t = await getTranslations('Reports')
  const common = await getTranslations('Common')
  const stats = await TicketService.getStats()
  const invStats = await InventoryService.getStats()
  
  // Real data for charts (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  // Group tickets by day
  const ticketsByDay = await prisma.ticket.findMany({
    where: {
      createdAt: { gte: last7Days[0] }
    },
    select: { createdAt: true }
  })

  const chartData = last7Days.map(day => {
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' })
    const count = ticketsByDay.filter(t => 
      new Date(t.createdAt).toDateString() === day.toDateString()
    ).length
    return { name: dayStr, tickets: count }
  })

  const facultyChartData = stats.byFaculty
    .filter(f => f.faculty)
    .map(f => ({
      name: f.faculty,
      value: f._count.tickets
    }))

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Reminders Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert className="border-primary/20 bg-primary/5">
          <Bell className="h-4 w-4 text-primary" />
          <AlertTitle className="font-bold">{t('reminderTitle')}</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            {t('reminderDesc')}
          </AlertDescription>
        </Alert>
        <Alert className="border-secondary/20 bg-secondary/5">
          <Info className="h-4 w-4 text-secondary" />
          <AlertTitle className="font-bold">{t('maintenanceTitle')}</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            {t('maintenanceDesc')}
          </AlertDescription>
        </Alert>
      </div>

      {/* High Level Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md bg-gradient-to-br from-primary to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <TrendingUp className="h-4 w-4" /> {t('totalTickets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs opacity-80 mt-1">{t('totalTickets')}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
               <Users className="h-4 w-4" /> {t('resolvedTickets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground mt-1">Resolution Rate: {Math.round((stats.resolved / stats.total) * 100) || 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-500">
               <MapPin className="h-4 w-4" /> {t('mostIssues')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {facultyChartData.length > 0 ? facultyChartData[0].name : common('no_data')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('mostIssues')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <TicketAnalyticsCharts data={chartData} facultyData={facultyChartData} />

      {/* Table of issues by faculty */}
      <Card>
        <CardHeader>
          <CardTitle>{t('facultyMonitoring')}</CardTitle>
          <CardDescription>{t('facultySubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
             {stats.byFaculty.map((f, i) => (
               <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{f.faculty || common('no_data')}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{t('totalTickets')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-2 bg-secondary/20 rounded-full overflow-hidden hidden md:block">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(f._count.tickets / stats.total) * 100}%` }}
                      />
                    </div>
                    <Badge variant="secondary">{f._count.tickets}</Badge>
                  </div>
               </div>
             ))}
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
