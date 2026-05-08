"use client"
import { usePathname, useRouter } from "@/i18n/routing"
import { useLocale } from "next-intl"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, User, Building2, Globe } from "lucide-react"
import { signOut } from "next-auth/react"
import { A11yControls } from "@/components/shared/A11yControls"
import { useTranslations } from "next-intl"

interface Branch {
  id: string
  name: string
}

export function Header({ userName, branches, currentBranchId }: { userName: string, branches?: Branch[], currentBranchId?: string }) {
  const t = useTranslations('Common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = (val: string | null) => {
    if (val) {
      router.replace(pathname, { locale: val })
    }
  }

  const handleBranchChange = (val: string | null) => {
    if (val) {
      document.cookie = `selected_branch=${val}; path=/; max-age=31536000` // 1 year
      router.refresh()
    }
  }

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Logo" className="h-8 object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x40/F39C12/FFFFFF.png?text=IMS+LOGO' }} />
        <span className="font-bold text-base tracking-tight text-foreground">BUCHEON</span>
      </div>
      
      <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-muted-foreground ml-4">
        <Building2 className="h-4 w-4" />
        {branches && (
          <Select value={currentBranchId || "ALL"} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-[200px] h-9 border-none shadow-none bg-secondary/50 font-semibold focus:ring-0">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('all') || 'All'}</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <A11yControls />

        <Select value={locale} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="uz">O'zbek</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full focus:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="text-sm font-medium">{userName}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('logout') || 'Log out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
