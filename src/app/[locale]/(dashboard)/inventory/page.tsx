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
import { Plus, Download, Upload, Image as ImageIcon, Search, ExternalLink } from "lucide-react"
import { createInventoryItem } from "@/lib/actions/inventory"
import { importInventoryExcel } from "@/lib/actions/excel"
import { InventoryService } from "@/services/InventoryService"
import { InventoryFilters } from "@/components/shared/InventoryFilters"
import { InventoryPagination } from "@/components/shared/InventoryPagination"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cookies } from "next/headers"
import { Link } from "@/i18n/routing"
import { getTranslations } from "next-intl/server"
import { AddInventoryDialog } from "@/components/shared/AddInventoryDialog"
import { ImportInventoryDialog } from "@/components/shared/ImportInventoryDialog"
import { SelectionProvider } from "@/components/shared/SelectionContext"
import { SelectionCheckbox, SelectAllCheckbox } from "@/components/shared/SelectionCheckbox"
import { BulkTransferAction } from "@/components/shared/BulkTransferAction"

export default async function InventoryPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string, category?: string, status?: string, faculty?: string, page?: string, perPage?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const t = await getTranslations("Inventory")
  const common = await getTranslations("Common")
  const loc = await getTranslations("Locations")
  
  const [categories, rooms, users] = await Promise.all([
    prisma.category.findMany(),
    prisma.room.findMany({
      select: {
        id: true,
        number: true,
        faculty: true,
        floor: {
          select: {
            number: true,
            building: { select: { name: true, branch: { select: { name: true } } } }
          }
        }
      },
      orderBy: { number: 'asc' }
    }),
    prisma.user.findMany({
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: 'asc' }
    })
  ])

  const cookieStore = await cookies()
  const branchId = cookieStore.get("selected_branch")?.value || "ALL"
  const currentPage = parseInt(resolvedSearchParams.page || "1", 10)
  const itemsPerPage = parseInt(resolvedSearchParams.perPage || "25", 10)

  const { items, total, totalPages, perPage } = await InventoryService.getItems({
    ...resolvedSearchParams,
    branchId,
    page: currentPage,
    perPage: itemsPerPage,
  })

  // Get all item IDs currently visible for the "Select All" feature
  const visibleItemIds = items.map(item => item.id)

  return (
    <SelectionProvider>
      <div className="space-y-6">
        <PageHeader 
          title={t("title")} 
          description={t("subtitle")}
        >
          <a href="/api/export-inventory" download>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> {t("export")}
            </Button>
          </a>

          <ImportInventoryDialog />
          <AddInventoryDialog categories={categories} />
        </PageHeader>

        <InventoryFilters categories={categories} />

        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <SelectAllCheckbox ids={visibleItemIds} />
                  </TableHead>
                  <TableHead className="w-10">№</TableHead>
                  <TableHead className="w-16">{common('photo') || "Rasm"}</TableHead>
                  <TableHead className="w-32">{t('inventoryNumber')}</TableHead>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{common('status')}</TableHead>
                  <TableHead>{t('room')}</TableHead>
                  <TableHead>{t('responsible')}</TableHead>
                  <TableHead className="text-right">{common('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <SelectionCheckbox id={item.id} />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-xs font-mono w-[48px]">
                      {(currentPage - 1) * perPage + index + 1}
                    </TableCell>
                  <TableCell>
                    {(item as any).imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(item as any).imageUrl} alt={item.name} className="w-12 h-12 rounded object-cover border" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center border">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-primary">
                    <Link href={`/inventory/${item.id}`} className="hover:underline font-semibold">
                      {(item as any).inventoryNumber || "---"}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/inventory/${item.id}`} className="hover:underline">
                      {item.name}
                    </Link>
                    {item.serialNumber && (
                      <div className="text-xs text-muted-foreground font-mono mt-1">SN: {item.serialNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'ACTIVE' ? 'default' : item.status === 'IN_REPAIR' ? 'destructive' : 'secondary'}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.room ? (
                      <span className="text-sm">{item.room.floor.building.name}, {item.room.number}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm italic opacity-50">{common('no_data')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.assignedTo ? (
                      <span className="text-sm">{item.assignedTo.fullName}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm italic opacity-50">{common('no_data')}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/inventory/${item.id}`}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
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

      <InventoryPagination 
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        perPage={perPage}
      />
      
      <BulkTransferAction rooms={rooms} users={users} />
    </div>
  </SelectionProvider>
  )
}
