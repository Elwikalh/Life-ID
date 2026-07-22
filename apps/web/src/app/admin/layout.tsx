import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import AdminShell from "./AdminShell"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = await currentUser()
  if (!me) redirect("/sign-in")

  const meta = me.publicMetadata as { role?: Role; status?: string }
  if (meta.role !== "super_admin") redirect("/dashboard")

  const name =
    [me.firstName, me.lastName].filter(Boolean).join(" ") ||
    me.emailAddresses?.[0]?.emailAddress ||
    "مدير النظام"

  return <AdminShell userName={name}>{children}</AdminShell>
}
