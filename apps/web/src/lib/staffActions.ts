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

// يلاقي المستخدم بالموبايل أو بـ ID التطبيق (كود QR) — لو اتلصق رابط QR بيطلّع الكود منه
async function findMember(identifierRaw: string) {
  const raw = identifierRaw.trim()
  if (!raw) return null
  const qrMatch = raw.match(/\/e\/([^/?#\s]+)/)
  const code = (qrMatch ? decodeURIComponent(qrMatch[1]) : raw).replace(
    /\s/g,
    "",
  )
  const phone = raw.replace(/\s/g, "")
  return prisma.user.findFirst({
    where: {
      OR: [{ phone }, { medicalId: { is: { qrCode: code } } }],
    },
  })
}

export async function addStaff(formData: FormData) {
  const u = await requireProvider()
  const identifier = String(formData.get("identifier") ?? "")
  const jobTitle = String(formData.get("jobTitle") ?? "").trim() || null
  const branchId = String(formData.get("branchId") ?? "").trim() || null
  const permissions = formData.getAll("permissions").map(String)
  if (!identifier.trim()) redirect("/profile/staff?error=identifier")

  const member = await findMember(identifier)
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

// تعديل بيانات موظّف موجود (الوظيفة/الفرع/الصلاحيات) برقم العضوية
export async function editStaff(formData: FormData) {
  const u = await requireProvider()
  const id = String(formData.get("membershipId") ?? "")
  const jobTitle = String(formData.get("jobTitle") ?? "").trim() || null
  const branchId = String(formData.get("branchId") ?? "").trim() || null
  const permissions = formData.getAll("permissions").map(String)
  const existing = await prisma.staffMembership.findUnique({ where: { id } })
  if (!existing || existing.providerId !== u.id)
    redirect("/profile/staff?error=fail")
  await prisma.staffMembership.update({
    where: { id },
    data: { jobTitle, branchId, permissions },
  })
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
