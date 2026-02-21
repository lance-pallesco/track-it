import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { getAuthSession } from "@/lib/auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()
  if (!session) {
    redirect("/login")
  }

  const user = session.user

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
          email: user.email,
          avatar: user.image,
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
