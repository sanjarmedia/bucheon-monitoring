"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InventorySearch } from "./InventorySearch"
import { assignInventoryToRoom } from "@/lib/actions/locations"
import { PackagePlus, Loader2, Search, FilePlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useTranslations } from "next-intl"

export function RoomInventoryManager({ roomId, categories }: { roomId: string, categories: any[] }) {
  const t = useTranslations('Rooms')
  const loc = useTranslations('Locations')
  const inv = useTranslations('Inventory')
  const common = useTranslations('Common')
  
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [activeTab, setActiveTab] = useState("search")
  const { toast } = useToast()

  // Manual form state
  const [manualItem, setManualItem] = useState({
    name: "",
    categoryId: "",
    inventoryNumber: "",
    serialNumber: "",
  })

  const handleAssign = async () => {
    setPending(true)
    try {
      const formData = new FormData()
      formData.append("roomId", roomId)

      if (activeTab === "search") {
        if (selectedItems.length === 0) return
        selectedItems.forEach(item => formData.append("inventoryIds", item.id))
      } else {
        if (!manualItem.name || !manualItem.categoryId) {
          toast({ variant: "destructive", title: common('error'), description: "Nom va kategoriya majburiy" })
          setPending(false)
          return
        }
        formData.append("isManual", "true")
        formData.append("name", manualItem.name)
        formData.append("categoryId", manualItem.categoryId)
        formData.append("inventoryNumber", manualItem.inventoryNumber)
        formData.append("serialNumber", manualItem.serialNumber)
      }

      await assignInventoryToRoom(formData)
      
      toast({
        title: common('success'),
        description: activeTab === "search" 
          ? `${selectedItems.length} ta jihoz xonaga biriktirildi.` 
          : "Yangi jihoz yaratildi va xonaga biriktirildi.",
      })
      
      setOpen(false)
      setSelectedItems([])
      setManualItem({ name: "", categoryId: "", inventoryNumber: "", serialNumber: "" })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: common('error'),
        description: error.message || "Xatolik yuz berdi.",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
      )}>
        <PackagePlus className="h-4 w-4" /> {t('addInventory')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('addInventory')}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" /> {common('search')}
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <FilePlus className="h-4 w-4" /> {loc('manualAdd')}
            </TabsTrigger>
          </TabsList>
 
          <TabsContent value="search" className="py-4 space-y-4">
            <InventorySearch onSelect={setSelectedItems} />
          </TabsContent>
 
          <TabsContent value="manual" className="py-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{inv('name')} *</Label>
                <Input 
                  placeholder="Masalan: Monitor Dell 24" 
                  value={manualItem.name}
                  onChange={e => setManualItem({...manualItem, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{inv('category')} *</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={manualItem.categoryId}
                  onChange={e => setManualItem({...manualItem, categoryId: e.target.value})}
                >
                  <option value="">— {common('search')} —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{inv('inventoryNumber')}</Label>
                  <Input 
                    placeholder="INV-001" 
                    value={manualItem.inventoryNumber}
                    onChange={e => setManualItem({...manualItem, inventoryNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{inv('serialNumber')}</Label>
                  <Input 
                    placeholder="SN-XYZ" 
                    value={manualItem.serialNumber}
                    onChange={e => setManualItem({...manualItem, serialNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
 
        <DialogFooter>
          <Button 
            onClick={handleAssign} 
            disabled={pending || (activeTab === "search" && selectedItems.length === 0)}
            className="w-full"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activeTab === "search" 
              ? (selectedItems.length > 0 ? `${selectedItems.length} ${common('add')}` : common('search'))
              : common('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
