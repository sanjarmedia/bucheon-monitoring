"use client"
import { Link, usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { LayoutDashboard, Package, Ticket, Users, MapPin, ChevronDown, ChevronRight, Circle, Settings, User } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"

export function Sidebar({ role }: { role?: string }) {
  const t = useTranslations('Sidebar')
  const pathname = usePathname()

  const allLinks = [
    { href: "/", key: "dashboard", icon: LayoutDashboard },
    { href: "/inventory", key: "inventory", icon: Package, hasSubmenu: true },
    { href: "/requests", key: "requests", icon: Ticket },
    { href: "/employees", key: "employees", icon: Users, adminOnly: true },
    { href: "/locations", key: "locations", icon: MapPin, adminOnly: true },
    { href: "/attendance", key: "attendance", icon: Users },
    { href: "/profile", key: "profile", icon: User },
    { href: "/settings", key: "settings", icon: Settings, adminOnly: true },
  ]

  const links = allLinks.filter(l => !l.adminOnly || (role === 'SUPER_ADMIN' || role === 'ADMIN'))

  const inventorySubmenu = [
    { href: "/inventory", label: t("all"), query: "" },
    { href: "/inventory?faculty=Litsey", label: t("litsey"), query: "?faculty=Litsey" },
    { href: "/inventory?faculty=Texnikum", label: t("texnikum"), query: "?faculty=Texnikum" },
    { href: "/inventory?faculty=Sklad", label: t("sklad"), query: "?faculty=Sklad" },
    { href: "/inventory?status=ACTIVE", label: t("active"), query: "?status=ACTIVE" },
    { href: "/inventory?status=WRITTEN_OFF", label: t("written_off"), query: "?status=WRITTEN_OFF" },
  ]

  const searchParams = useSearchParams()
  const isInventoryActive = pathname === "/inventory" || pathname.startsWith("/inventory/")
  const [isInventoryOpen, setIsInventoryOpen] = useState(isInventoryActive)

  return (
    <aside className="w-64 border-r bg-card hidden md:flex flex-col">
      <div className="h-16 flex items-center gap-3 px-6 border-b">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="University IMS" className="h-10 object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x50/F39C12/FFFFFF.png?text=IMS+LOGO' }} />
        <span className="font-bold text-lg tracking-tight text-foreground">BUCHEON</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== "/")
            
            if (link.hasSubmenu && link.key === "inventory") {
              return (
                <li key={link.href} className="flex flex-col gap-1">
                  <button
                    onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                    className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors ${
                      isInventoryActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {t(link.key)}
                    </div>
                    {isInventoryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  
                  {isInventoryOpen && (
                    <ul className="ml-4 pl-3 mt-1 space-y-1 border-l border-primary/20">
                      {inventorySubmenu.map((sub) => {
                        const currentQuery = searchParams.toString() ? `?${searchParams.toString()}` : ""
                        const isSubActive = pathname === "/inventory" && (
                          (sub.query === "" && currentQuery === "") || 
                          (sub.query !== "" && currentQuery.includes(sub.query.replace("?", "")))
                        )
                        return (
                          <li key={sub.label}>
                            <Link
                              href={sub.href}
                              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                                isSubActive
                                  ? "text-primary font-medium bg-primary/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              }`}
                            >
                              <Circle className={`h-2 w-2 ${isSubActive ? "fill-primary text-primary" : ""}`} />
                              {sub.label}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            }

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(link.key)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
