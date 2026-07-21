import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { RolePicker } from "./role-picker"

export default async function OnboardingPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (meta.role) {
    redirect(meta.status === "approved" ? "/dashboard" : "/pending")
  }

  async function setRole(role: Role) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")
    const client = await clerkClient()
    await client.users.updateUserMetadata(u.id, {
      publicMetadata: { role, status: "pending" }
    })
    redirect("/pending")
  }

  return <RolePicker onPick={setRole} />
}
