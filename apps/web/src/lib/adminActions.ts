"use server"

import { prisma } from "@life-id/db"
import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"

const ROLES: Role[] = [
  "patient",
  "doctor",
  "clinic",
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
  "medical_rep",
  "emergency",
  "super_admin",
]

async function getAdmin() {
  const me = await currentUser()
  if (!me) return null
  const meta = me.publicMetadata as { role?: string }
  if (meta.role !== "super_admin") return null
  return me
}

// تغيير دور مستخدم (يحدّث قاعدة البيانات و Clerk معًا)
export async function changeUserRole(formData: FormData) {
  const userId = String(formData.get("userId") || "")
  const section = String(formData.get("section") || "")
  const role = String(formData.get("role") || "") as Role
  const base = "/admin/" + section + "/" + userId

  const me = await getAdmin()
  if (!me) redirect(base + "?error=denied")
  if (!userId || !ROLES.includes(role)) redirect(base + "?error=invalid")
  if (me.id === userId) redirect(base + "?error=self")

  let ok = false
  try {
    await prisma.user.update({ where: { id: userId }, data: { role } })
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    })
    ok = true
  } catch {
    ok = false
  }
  redirect(base + (ok ? "?ok=role" : "?error=fail"))
}

// تفعيل أو تعليق حساب مستخدم (عبر حالة Clerk)
export async function setUserStatus(formData: FormData) {
  const userId = String(formData.get("userId") || "")
  const section = String(formData.get("section") || "")
  const status = String(formData.get("status") || "")
  const base = "/admin/" + section + "/" + userId

  const me = await getAdmin()
  if (!me) redirect(base + "?error=denied")
  if (status !== "approved" && status !== "suspended")
    redirect(base + "?error=invalid")
  if (me.id === userId) redirect(base + "?error=self")

  let ok = false
  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { status },
    })
    ok = true
  } catch {
    ok = false
  }
  redirect(base + (ok ? "?ok=" + status : "?error=fail"))
}

// إضافة أدمن منصة (super_admin) بالموبايل أو ID التطبيق (كود QR) + الصلاحيات
export async function addAdmin(formData: FormData) {
  const me = await getAdmin()
  if (!me) redirect("/admin/admins?error=denied")

  const raw = String(formData.get("identifier") ?? "").trim()
  const permissions = formData.getAll("permissions").map(String)
  if (!raw) redirect("/admin/admins?error=notfound")

  const qrMatch = raw.match(/\/e\/([^/?#\s]+)/)
  const code = (qrMatch ? decodeURIComponent(qrMatch[1]) : raw).replace(
    /\s/g,
    "",
  )
  const phone = raw.replace(/\s/g, "")

  const member = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { medicalId: { is: { qrCode: code } } }],
    },
  })
  if (!member) redirect("/admin/admins?error=notfound")

  let ok = false
  try {
    await prisma.user.update({
      where: { id: member.id },
      data: { role: "super_admin", adminPermissions: permissions },
    })
    const client = await clerkClient()
    await client.users.updateUserMetadata(member.id, {
      publicMetadata: { role: "super_admin", status: "approved" },
    })
    ok = true
  } catch {
    ok = false
  }
  if (!ok) redirect("/admin/admins?error=fail")
  revalidatePath("/admin/admins")
  redirect("/admin/admins?saved=1")
}
