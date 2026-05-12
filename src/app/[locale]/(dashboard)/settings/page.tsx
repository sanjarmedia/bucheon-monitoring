import { getTranslations } from "next-intl/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Send, Database, Share2, MessageSquare } from "lucide-react"

export default async function SettingsPage() {
  const common = await getTranslations("Common")
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tizim Sozlamalari" 
        description="Integratsiyalar va platforma konfiguratsiyasi"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" /> Telegram Bot
            </CardTitle>
            <CardDescription>Arizalar haqida bildirishnomalar yuborish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="tg-enabled">Integratsiyani yoqish</Label>
              <Switch id="tg-enabled" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <Input type="password" placeholder="78234234:AAH324..." />
            </div>
            <div className="space-y-2">
              <Label>Chat ID (Group/Admin)</Label>
              <Input placeholder="-10023423423" />
            </div>
          </CardContent>
        </Card>

        {/* Google Sheets Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" /> Google Sheets Sync
            </CardTitle>
            <CardDescription>Inventarizatsiyani avtomatik sinxronizatsiya qilish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gs-enabled">Avto-sinxronlash</Label>
              <Switch id="gs-enabled" />
            </div>
            <div className="space-y-2">
              <Label>Spreadsheet ID</Label>
              <Input placeholder="1BxiMVs0XRA5nZm4F..." />
            </div>
          </CardContent>
        </Card>

        {/* CCTV Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-500" /> CCTV / Monitoring
            </CardTitle>
            <CardDescription>Kuzatuv kameralari server manzili</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>VMS Server URL</Label>
              <Input placeholder="http://192.168.1.100:8080" />
            </div>
            <div className="space-y-2">
              <Label>Stream Protocol</Label>
              <Input placeholder="HLS / WebRTC" defaultValue="HLS" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4">
        <Button className="shadow-2xl h-12 px-8 gap-2 rounded-full">
          <Save className="h-5 w-5" /> {common('save')}
        </Button>
      </div>
    </div>
  )
}
