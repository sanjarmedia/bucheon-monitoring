import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { PageTransition } from "@/components/shared/PageTransition"
import { LocationService } from "@/services/LocationService"
import { cookies } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  let branches: any[] = []
  try {
    branches = await LocationService.getFullLocationTree()
  } catch (error) {
    console.error("Layout location tree error:", error)
  }
  const cookieStore = await cookies()
  const selectedBranchId = cookieStore.get("selected_branch")?.value || "ALL"

  if (!session?.user) {
    redirect("/en/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
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
