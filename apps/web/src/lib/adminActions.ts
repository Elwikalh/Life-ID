"use server"

import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

async function requireAdmin() {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const role = (u.publicMetadata as { role?: string }).role
  if (role !== "admin") redirect("/dashboard")
  return u
}

export async function addAdmin(formData: FormData) {
  await requireAdmin()
  const identifier = String(formData.get("identifier") ?? "")
    .trim()
    .replace(/\s/g, "")
  const permissions = formData.getAll("permissions").map(String)
  if (!identifier) redirect("/admin/admins?error=notfound")

  const member = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { nationalId: identifier }] },
  })
  if (!member) redirect("/admin/admins?error=notfound")

  try {
    await prisma.user.update({
      where: { id: member.id },
      data: { role: "admin", adminPermissions: permissions },
    })
  } catch {
    redirect("/admin/admins?error=fail")
  }

  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(member.id, {
      publicMetadata: { role: "admin", status: "approved" },
    })
  } catch {}

  revalidatePath("/admin/admins")
  redirect("/admin/admins?saved=1")
}
