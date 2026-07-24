"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

const PROVIDER_ROLES = [
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "emergency",
  "pharma_company",
]

async function requireProvider() {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const role = (u.publicMetadata as { role?: string }).role
  if (!role || !PROVIDER_ROLES.includes(role)) redirect("/dashboard")
  return u
}

export async function addBranch(formData: FormData) {
  const u = await requireProvider()
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) redirect("/profile/branches?error=name")
  const city = String(formData.get("city") ?? "").trim() || null
  const address = String(formData.get("address") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const isMain = formData.get("isMain") === "on"

  await prisma.branch.create({
    data: { providerId: u.id, name, city, address, phone, isMain },
  })
  revalidatePath("/profile/branches")
  redirect("/profile/branches?saved=1")
}

export async function deleteBranch(formData: FormData) {
  const u = await requireProvider()
  const id = String(formData.get("branchId") ?? "")
  const existing = await prisma.branch.findUnique({ where: { id } })
  if (!existing || existing.providerId !== u.id)
    redirect("/profile/branches?error=fail")
  await prisma.branch.delete({ where: { id } })
  revalidatePath("/profile/branches")
  redirect("/profile/branches?removed=1")
}
