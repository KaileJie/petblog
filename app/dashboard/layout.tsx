import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Don't check subscription here - let the page component handle it
  // This allows session_id verification to work properly
  // The page component will redirect to /subscribe if needed

  return <DashboardSidebar>{children}</DashboardSidebar>
}

