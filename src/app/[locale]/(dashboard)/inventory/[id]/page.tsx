import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Link } from "@/i18n/routing"
import { ArrowLeft, Edit, MapPin, User, Tag, Calendar, DollarSign, Activity, Image as ImageIcon, History } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { EditInventoryDialog } from "@/components/shared/EditInventoryDialog"
import { DeleteInventoryButton } from "@/components/shared/DeleteInventoryButton"

import { TransferInventoryDialog } from "@/components/shared/TransferInventoryDialog"

export default async function InventoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  
  const [item, rooms, users] = await Promise.all([
    prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        room: {
          include: { floor: { include: { building: { include: { branch: true } } } } }
        },
        assignedTo: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    }),
    prisma.room.findMany({
      select: {
        id: true,
        number: true,
        faculty: true,
        floor: {
          select: {
            number: true,
            building: {
              select: {
                name: true,
                branch: {
                  select: { name: true }
                }
              }
            }
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

  if (!item) {
    notFound()
  }

  const t = await getTranslations("Inventory")
  const common = await getTranslations("Common")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
              <Badge variant={item.status === 'ACTIVE' ? 'default' : item.status === 'IN_REPAIR' ? 'destructive' : 'secondary'}>
                {item.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono mt-1">
              {item.inventoryNumber || t('noInv')} | SN: {item.serialNumber || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <TransferInventoryDialog itemIds={[item.id]} rooms={rooms} users={users} />
          <EditInventoryDialog item={{
            id: item.id,
            name: item.name,
            inventoryNumber: item.inventoryNumber,
            serialNumber: item.serialNumber,
            status: item.status,
            cost: item.cost
          }} />
          {(session?.user as any).role === 'SUPER_ADMIN' && (
            <DeleteInventoryButton id={item.id} name={item.name} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ITEM SPECS */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('specs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-1"><Tag className="h-4 w-4" /> {t('category')}</Label>
                <div className="font-medium">{item.category.name}</div>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-1"><MapPin className="h-4 w-4" /> {t('room')}</Label>
                <div className="font-medium">
                  {item.room ? `${item.room.floor.building.name}, ${item.room.number}` : t('notAssigned')}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-1"><User className="h-4 w-4" /> {t('assignedTo')}</Label>
                <div className="font-medium">{item.assignedTo ? item.assignedTo.fullName : common('no_data')}</div>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4" /> {t('cost')}</Label>
                <div className="font-medium">{item.cost ? `$${item.cost.toFixed(2)}` : "N/A"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-1"><Calendar className="h-4 w-4" /> {t('purchaseDate')}</Label>
                <div className="font-medium">{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : t('unknown')}</div>
              </div>
              <div>
                <Label className="text-muted-foreground flex items-center gap-2 mb-1"><Activity className="h-4 w-4" /> {t('supplier')}</Label>
                <div className="font-medium">{item.supplier || t('unknown')} {item.warrantyInfo ? `(${item.warrantyInfo})` : ""}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ITEM IMAGE */}
        <Card>
          <CardHeader>
            <CardTitle>{t('itemPhoto')}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="w-full max-w-[250px] rounded-lg border object-cover aspect-square" />
            ) : (
              <div className="w-full max-w-[250px] aspect-square bg-muted rounded-lg border flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">{t('noImage')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HISTORY TIMELINE */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>{t('lifecycle')}</CardTitle>
          </div>
          <CardDescription>{t('auditTrail')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {item.history.map((log, i) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/20 text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={log.action === 'CREATED' ? 'default' : 'secondary'}>{log.action}</Badge>
                    <time className="text-xs text-muted-foreground font-mono">{new Date(log.createdAt).toLocaleString()}</time>
                  </div>
                  <p className="text-sm font-medium mt-2">{log.description}</p>
                  
                  {/* Detailed changes if they exist */}
                  {(log.previousStatus || log.newStatus) && (
                    <div className="text-xs mt-2 text-muted-foreground">
                      {common('status')} {common('edit').toLowerCase()}: <span className="line-through">{log.previousStatus}</span> ➔ <span className="font-bold text-foreground">{log.newStatus}</span>
                    </div>
                  )}
                  {(log.fromRoomId || log.toRoomId) && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      {t('locationUpdate')}
                    </div>
                  )}
                  
                  <div className="text-xs mt-3 flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" /> {t('user')}: {log.performedById}
                  </div>
                </div>
              </div>
            ))}
            {item.history.length === 0 && (
              <p className="text-center text-muted-foreground">{t('noHistory')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
