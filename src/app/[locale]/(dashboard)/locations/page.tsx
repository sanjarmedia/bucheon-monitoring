import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building, Layers, DoorOpen, Plus } from "lucide-react"
import { Link } from "@/i18n/routing"
import { LocationService } from "@/services/LocationService"
import { PageHeader } from "@/components/shared/PageHeader"
import { IsometricBuilding } from "@/components/shared/IsometricBuilding"
import { LocationFormDialog } from "@/components/shared/LocationFormDialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  let categories: any[] = []
  
  try {
    const results = await Promise.all([
      LocationService.getFullLocationTree(),
      prisma.user.findMany({
        select: { id: true, fullName: true, role: true },
        orderBy: { fullName: 'asc' }
      }),
      prisma.category.findMany()
    ])
    branches = results[0]
    users = results[1]
    categories = results[2]
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
        <LocationFormDialog 
          title={t('addBranch')}
          triggerLabel={t('addBranch')}
          triggerIcon={<Plus className="h-4 w-4" />}
          action={createBranch}
          variant="default"
          className="gap-2 shadow-lg"
        >
          <div className="space-y-2">
            <Label htmlFor="name">{t('branch')} {inventory('name')}</Label>
            <Input id="name" name="name" placeholder={inventory('name')} required />
          </div>
        </LocationFormDialog>
      </PageHeader>

      <div className="grid gap-4">
        {branches.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
              <MapPin className="h-12 w-12 mb-4 opacity-20" />
              <p>{common('no_data')}</p>
            </CardContent>
          </Card>
        )}

        <Accordion className="w-full space-y-4" type="multiple" defaultValue={branches.map(b => b.id)}>
          {branches.map((branch: any) => (
            <AccordionItem key={branch.id} value={branch.id} className="border-none shadow-md rounded-2xl bg-white/60 backdrop-blur-md px-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <AccordionTrigger className="hover:no-underline text-xl font-bold flex-1 py-6">
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    {branch.name}
                  </span>
                </AccordionTrigger>
                
                <LocationFormDialog
                  title={`${t('addBuilding')} - ${branch.name}`}
                  triggerLabel={t('addBuilding')}
                  triggerIcon={<Plus className="h-3 w-3" />}
                  action={createBuilding}
                  className="mr-4"
                >
                  <input type="hidden" name="branchId" value={branch.id} />
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('building')} {inventory('name')}</Label>
                    <Input id="name" name="name" placeholder={inventory('name')} required />
                  </div>
                </LocationFormDialog>
              </div>
              
              <AccordionContent className="pt-2 pb-6 border-t border-primary/5">
                {branch.buildings.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic pl-12 py-4">{t('noBuildings')}</p>
                ) : (
                  <Accordion className="w-full space-y-4 pl-8" type="multiple">
                    {branch.buildings.map((building: any) => (
                      <AccordionItem key={building.id} value={building.id} className="border rounded-xl bg-secondary/20 px-4">
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="hover:no-underline text-lg font-semibold flex-1 py-4">
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-primary/80" /> {building.name}
                            </span>
                          </AccordionTrigger>
                          
                          <LocationFormDialog
                            title={`${t('addFloor')} - ${building.name}`}
                            triggerLabel={t('addFloor')}
                            triggerIcon={<Plus className="h-3 w-3" />}
                            action={createFloor}
                            size="xs"
                            className="mr-3"
                          >
                            <input type="hidden" name="buildingId" value={building.id} />
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="number">{t('floor')} №</Label>
                                <Input id="number" name="number" type="number" placeholder="1" required />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="label">{t('faculty')}</Label>
                                <Input id="label" name="label" placeholder={t('faculty')} />
                              </div>
                            </div>
                          </LocationFormDialog>
                        </div>

                        <AccordionContent className="pb-4">
                          {/* 3D Isometric Viewer */}
                          {building.floors.length > 0 && (
                            <div className="mb-8 rounded-xl overflow-hidden shadow-inner bg-white/40 border p-1">
                              <IsometricBuilding building={building as any} categories={categories} />
                            </div>
                          )}

                          {building.floors.length === 0 ? (
                            <p className="text-muted-foreground text-sm italic pl-6 py-2">{t('noFloors')}</p>
                          ) : (
                            <div className="space-y-4 pl-6">
                              {building.floors.map((floor: any) => (
                                <div key={floor.id} className="border rounded-xl bg-white/80 p-4 shadow-sm border-primary/5">
                                  <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg mb-4">
                                    <span className="text-sm font-bold flex items-center gap-2 text-primary">
                                      <Layers className="h-3 w-3" /> {t('floor')} {floor.number} 
                                      <Badge variant="secondary" className="ml-2 font-mono">{floor.rooms.length} {t('roomNumber')}</Badge>
                                    </span>
                                    
                                    <LocationFormDialog
                                      title={`${t('addRoom')} - ${t('floor')} ${floor.number}`}
                                      triggerLabel={t('addRoom')}
                                      triggerIcon={<Plus className="h-3 w-3" />}
                                      action={async (formData) => { "use server"; /* Form handling will happen inside the component */ }}
                                      size="xs"
                                      variant="secondary"
                                    >
                                      {/* Due to complex Tabs, I'll pass a special child or handle it differently if needed */}
                                      {/* For now, keep the structure but wrap with granular logic */}
                                      <Tabs defaultValue="bulk" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                          <TabsTrigger value="bulk">{t('bulkAdd')}</TabsTrigger>
                                          <TabsTrigger value="single">{t('singleRoom')}</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="bulk">
                                           {/* We'll handle this in a separate component if it gets too complex */}
                                           <div className="text-center text-xs text-muted-foreground py-4 italic">
                                              Bulk add logic needs dedicated handler.
                                           </div>
                                        </TabsContent>
                                      </Tabs>
                                    </LocationFormDialog>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {floor.rooms.length === 0 ? (
                                      <p className="text-muted-foreground text-xs italic">{t('noRooms')}</p>
                                    ) : (
                                      floor.rooms.map((room: any) => (
                                        <Link href={`/locations/rooms/${room.id}`} key={room.id}>
                                          <Badge variant="outline" className="flex items-center gap-1 py-1.5 px-3 text-sm hover:bg-primary hover:text-white cursor-pointer transition-all border-primary/20 shadow-sm">
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
