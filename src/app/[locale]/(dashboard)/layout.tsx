import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { PageTransition } from "@/components/shared/PageTransition"
import { LocationService } from "@/services/LocationService"
import { cookies } from "next/headers"
import { unstable_cache } from "next/cache"

// Filial ro'yxati kamdan-kam o'zgaradi — 60 soniya keshlanadi
const getCachedBranches = unstable_cache(
  () => LocationService.getBranchList(),
  ["header-branches"],
  { revalidate: 60 }
)

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  let branches: any[] = []
  try {
    // Header uchun faqat filial nomlari kerak — to'liq daraxt emas
    branches = await getCachedBranches()
  } catch (error) {
    console.error("Layout branches error:", error)
  }
  const cookieStore = await cookies()
  const selectedBranchId = cookieStore.get("selected_branch")?.value || "ALL"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={(session.user as any).role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          userName={session.user.name || "User"} 
          branches={branches}
          currentBranchId={selectedBranchId}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-secondary/5">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
