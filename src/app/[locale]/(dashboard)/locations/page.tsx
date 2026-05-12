import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Building, Layers, DoorOpen } from "lucide-react"
import { Link } from "@/i18n/routing"
import { LocationService } from "@/services/LocationService"
import { PageHeader } from "@/components/shared/PageHeader"
import { IsometricBuilding } from "@/components/shared/IsometricBuilding"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createBranch,
  createBuilding,
  createFloor,
  createRoom,
  bulkCreateRooms
} from "@/lib/actions/locations"

export default async function LocationsPage() {
  let branches: any[] = []
  let users: any[] = []
  
  try {
    [branches, users] = await Promise.all([
      LocationService.getFullLocationTree(),
      prisma.user.findMany({
        select: { id: true, fullName: true, role: true },
        orderBy: { fullName: 'asc' }
      })
    ])
  } catch (error) {
    console.error("Locations data error:", error)
  }
  const t = await getTranslations('Locations')
  const common = await getTranslations('Common')
  const inventory = await getTranslations('Inventory')
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
      >
        <Dialog>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" /> {t('addBranch')}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addBranch')}</DialogTitle>
            </DialogHeader>
            <form action={createBranch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('branch')} {inventory('name')}</Label>
                <Input id="name" name="name" placeholder={inventory('name')} required />
              </div>
              <DialogFooter>
                <Button type="submit">{common('save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4">
        {branches.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4 opacity-20" />
              <p>{common('no_data')}</p>
            </CardContent>
          </Card>
        )}

        <Accordion className="w-full space-y-4" multiple>
          {branches.map((branch: any) => (
            <AccordionItem key={branch.id} value={branch.id} className="border rounded-lg bg-card px-4">
              <div className="flex items-center justify-between">
                <AccordionTrigger className="hover:no-underline text-xl font-semibold flex-1">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> {branch.name}
                  </span>
                </AccordionTrigger>
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" size="sm" className="mr-4" />}>
                    <Plus className="h-3 w-3 mr-1" /> {t('addBuilding')}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('addBuilding')} - {branch.name}</DialogTitle>
                    </DialogHeader>
                    <form action={createBuilding} className="space-y-4">
                      <input type="hidden" name="branchId" value={branch.id} />
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('building')} {inventory('name')}</Label>
                        <Input id="name" name="name" placeholder={inventory('name')} required />
                      </div>
                      <DialogFooter>
                        <Button type="submit">{common('save')}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <AccordionContent className="pt-2 pb-4">
                {branch.buildings.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic pl-7">{t('noBuildings')}</p>
                ) : (
                  <Accordion className="w-full space-y-3 pl-7" multiple>
                    {branch.buildings.map((building: any) => (
                      <AccordionItem key={building.id} value={building.id} className="border rounded-md bg-muted/30 px-3">
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="hover:no-underline text-lg font-medium flex-1 py-3">
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-primary/80" /> {building.name}
                            </span>
                          </AccordionTrigger>
                          <Dialog>
                            <DialogTrigger render={<Button variant="outline" size="xs" className="mr-3" />}>
                              <Plus className="h-3 w-3 mr-1" /> {t('addFloor')}
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('addFloor')} - {building.name}</DialogTitle>
                              </DialogHeader>
                              <form action={createFloor} className="space-y-4">
                                <input type="hidden" name="buildingId" value={building.id} />
                                <div className="space-y-2">
                                  <Label htmlFor="number">{t('floor')} №</Label>
                                  <Input id="number" name="number" type="number" placeholder="1" required />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="label">{t('floorLabel')}</Label>
                                  <Input id="label" name="label" placeholder={t('faculty')} />
                                </div>
                                <DialogFooter>
                                  <Button type="submit">{common('save')}</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <AccordionContent className="pb-3">
                          {/* 3D Isometric Viewer */}
                          {building.floors.length > 0 && (
                            <div className="mb-6">
                              <IsometricBuilding building={building as any} />
                            </div>
                          )}

                          {building.floors.length === 0 ? (
                            <p className="text-muted-foreground text-sm italic pl-6">{t('noFloors')}</p>
                          ) : (
                            <div className="space-y-4 pl-6">
                              {building.floors.map((floor: any) => (
                                <div key={floor.id} className="border rounded-md bg-background p-3">
                                  <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-md mb-3">
                                    <span className="text-sm font-semibold flex items-center gap-2">
                                      <Layers className="h-3 w-3" /> {t('floor')} {floor.number} 
                                      <Badge variant="outline" className="ml-2">{floor.rooms.length} {t('roomNumber')}</Badge>
                                    </span>
                                    <Dialog>
                                      <DialogTrigger render={<Button variant="secondary" size="xs" />}>
                                        <Plus className="h-3 w-3 mr-1" /> {t('addRoom')}
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>{t('addRoom')} - {t('floor')} {floor.number}</DialogTitle>
                                        </DialogHeader>
                                        
                                        <Tabs defaultValue="bulk" className="w-full mt-2">
                                          <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="bulk">{t('bulkAdd')}</TabsTrigger>
                                            <TabsTrigger value="single">{t('singleRoom')}</TabsTrigger>
                                          </TabsList>
                                          
                                          <TabsContent value="bulk" className="pt-4">
                                            <form action={bulkCreateRooms} className="space-y-4">
                                              <input type="hidden" name="floorId" value={floor.id} />
                                              <div className="space-y-2">
                                                <Label htmlFor="prefix">{t('roomPrefix')}</Label>
                                                <Input id="prefix" name="prefix" placeholder="IT-" />
                                              </div>
                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label htmlFor="start">{t('startNumber')}</Label>
                                                  <Input id="start" name="start" type="number" placeholder="101" required />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label htmlFor="end">{t('endNumber')}</Label>
                                                  <Input id="end" name="end" type="number" placeholder="110" required />
                                                </div>
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                {t('bulkDesc')}
                                              </p>
                                              <DialogFooter>
                                                <Button type="submit">{t('generateRooms')}</Button>
                                              </DialogFooter>
                                            </form>
                                          </TabsContent>
                                          
                                          <TabsContent value="single" className="pt-4">
                                            <form action={createRoom} className="space-y-4">
                                              <input type="hidden" name="floorId" value={floor.id} />
                                              <div className="space-y-2">
                                                <Label>{t('roomNumber')} / {inventory('name')} *</Label>
                                                <Input name="number" placeholder={t('roomNumber')} required />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>{t('faculty')}</Label>
                                                <Input name="faculty" placeholder={t('faculty')} />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>{inventory('responsible')}</Label>
                                                <select name="responsibleId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                                                  <option value="">— {common('search')} —</option>
                                                  {users.map((u: any) => (
                                                    <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                                                  ))}
                                                </select>
                                              </div>
                                              <div className="space-y-2">
                                                <Label>{t('responsibleSince')}</Label>
                                                <Input name="responsibleSince" type="date" />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>{t('inventory')} (INV №)</Label>
                                                <Input name="initialInventory" placeholder="INV-001, INV-002..." />
                                              </div>
                                              <DialogFooter>
                                                <Button type="submit">{common('save')}</Button>
                                              </DialogFooter>
                                            </form>
                                          </TabsContent>
                                        </Tabs>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {floor.rooms.length === 0 ? (
                                      <p className="text-muted-foreground text-xs italic">{t('noRooms')}</p>
                                    ) : (
                                      floor.rooms.map((room: any) => (
                                        <Link href={`/locations/rooms/${room.id}`} key={room.id}>
                                          <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 text-sm hover:bg-primary/10 cursor-pointer transition-colors">
                                            <DoorOpen className="h-3 w-3" /> {room.number}
                                          </Badge>
                                        </Link>
                                      ))
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

