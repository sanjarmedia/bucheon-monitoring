import { getTranslations } from "next-intl/server"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Send, Database, Share2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { saveSystemSettings } from "@/lib/actions/settings"

export default async function SettingsPage() {
  const common = await getTranslations("Common")
  
  const settings = await prisma.systemSetting.findMany()
  const getVal = (key: string) => settings.find(s => s.key === key)?.value || ""

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tizim Sozlamalari" 
        description="Integratsiyalar va platforma konfiguratsiyasi"
      />

      <form action={saveSystemSettings}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
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
                <Label htmlFor="tg_enabled">Integratsiyani yoqish</Label>
                <Switch id="tg_enabled" name="tg_enabled" defaultChecked={getVal('tg_enabled') === 'on'} />
              </div>
              <div className="space-y-2">
                <Label>Bot Token</Label>
                <Input name="tg_token" type="password" defaultValue={getVal('tg_token')} placeholder="78234234:AAH324..." />
              </div>
              <div className="space-y-2">
                <Label>Chat ID (Group/Admin)</Label>
                <Input name="tg_chat_id" defaultValue={getVal('tg_chat_id')} placeholder="-10023423423" />
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
                <Label htmlFor="gs_enabled">Avto-sinxronlash</Label>
                <Switch id="gs_enabled" name="gs_enabled" defaultChecked={getVal('gs_enabled') === 'on'} />
              </div>
              <div className="space-y-2">
                <Label>Spreadsheet ID</Label>
                <Input name="gs_id" defaultValue={getVal('gs_id')} placeholder="1BxiMVs0XRA5nZm4F..." />
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
                <Input name="cctv_url" defaultValue={getVal('cctv_url')} placeholder="http://192.168.1.100:8080" />
              </div>
              <div className="space-y-2">
                <Label>Stream Protocol</Label>
                <Input name="cctv_protocol" defaultValue={getVal('cctv_protocol')} placeholder="HLS / WebRTC" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-8 right-8 z-50">
          <Button type="submit" className="shadow-2xl h-12 px-8 gap-2 rounded-full scale-110 hover:scale-115 transition-transform">
            <Save className="h-5 w-5" /> {common('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
