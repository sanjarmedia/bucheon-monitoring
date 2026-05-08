import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "next-intl/server"

export default async function EmployeesPage() {
  const t = await getTranslations('Employees')
  const common = await getTranslations('Common')
  const inv = await getTranslations('Inventory')
  
  const employees = await prisma.user.findMany({
    include: {
      room: {
        include: {
          floor: {
            include: {
              building: {
                include: {
                  branch: true
                }
              }
            }
          }
        }
      },
      manager: true
    },
    orderBy: { fullName: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{inv('name')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{t('location')}</TableHead>
                <TableHead>{t('manager')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.role.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    {emp.room ? (
                      <span className="text-sm text-muted-foreground">
                        {emp.room.floor.building.branch.name}, {emp.room.floor.building.name}, {emp.room.number}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic opacity-50">{common('no_data')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {emp.manager ? emp.manager.fullName : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
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

