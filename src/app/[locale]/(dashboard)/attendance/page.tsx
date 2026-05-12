import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, UserCheck, UserX, CalendarClock } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { PageHeader } from "@/components/shared/PageHeader"

export default async function AttendancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('Attendance')
  const side = await getTranslations('Sidebar')
  const empT = await getTranslations('Employees')
  const common = await getTranslations('Common')
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayAttendance = await prisma.dailyAttendance.findMany({
    where: { date: today },
    include: { user: true }
  })

  const totalEmployees = await prisma.user.count()
  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
  const lateCount = todayAttendance.filter(a => a.status === 'LATE').length
  const absentCount = totalEmployees - presentCount

  const formatTime = (date: Date | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "-"
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={side('attendance')} 
        description={t('title')}
      >
        <Link href="/attendance/leaves">
          <Button variant="outline">{t('leaves')}</Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{side('employees')}</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('checkIn')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('late')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lateCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{common('status')}</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{absentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{new Date().toLocaleDateString(locale)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{side('employees')}</TableHead>
                <TableHead>{empT('role')}</TableHead>
                <TableHead>{t('checkIn')}</TableHead>
                <TableHead>{t('checkOut')}</TableHead>
                <TableHead>{side('attendance')}</TableHead>
                <TableHead>{common('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.user.fullName}</TableCell>
                  <TableCell>{record.user.role.replace("_", " ")}</TableCell>
                  <TableCell>{formatTime(record.firstIn)}</TableCell>
                  <TableCell>{formatTime(record.lastOut)}</TableCell>
                  <TableCell>{formatDuration(record.totalWorkMinutes)}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'PRESENT' ? 'default' : record.status === 'LATE' ? 'destructive' : 'secondary'}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {todayAttendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
