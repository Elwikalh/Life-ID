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

export async function addStaff(formData: FormData) {
  const u = await requireProvider()
  const identifier = String(formData.get("identifier") ?? "")
    .trim()
    .replace(/\s/g, "")
  const jobTitle = String(formData.get("jobTitle") ?? "").trim() || null
  const branchId = String(formData.get("branchId") ?? "").trim() || null
  const permissions = formData.getAll("permissions").map(String)
  if (!identifier) redirect("/profile/staff?error=identifier")

  const member = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { nationalId: identifier }] },
  })
  if (!member) redirect("/profile/staff?error=notfound")
  if (member.id === u.id) redirect("/profile/staff?error=self")

  try {
    await prisma.staffMembership.upsert({
      where: {
        providerId_memberId: { providerId: u.id, memberId: member.id },
      },
      update: { jobTitle, branchId, permissions, status: "active" },
      create: {
        providerId: u.id,
        memberId: member.id,
        jobTitle,
        branchId,
        permissions,
      },
    })
  } catch {
    redirect("/profile/staff?error=fail")
  }

  revalidatePath("/profile/staff")
  redirect("/profile/staff?saved=1")
}

export async function removeStaff(formData: FormData) {
  const u = await requireProvider()
  const id = String(formData.get("membershipId") ?? "")
  const existing = await prisma.staffMembership.findUnique({ where: { id } })
  if (!existing || existing.providerId !== u.id)
    redirect("/profile/staff?error=fail")
  await prisma.staffMembership.delete({ where: { id } })
  revalidatePath("/profile/staff")
  redirect("/profile/staff?removed=1")
}
