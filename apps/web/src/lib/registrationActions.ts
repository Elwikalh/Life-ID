"use server"

import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"

const MAX_BYTES = 2 * 1024 * 1024 // 2 ميجابايت

const VALID_ROLES: Role[] = [
  "patient",
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "emergency",
  "pharma_company",
  "medical_rep",
]

type PhotoResult = string | null | "ERR_TYPE" | "ERR_SIZE"

async function fileToDataUrl(
  file: FormDataEntryValue | null,
): Promise<PhotoResult> {
  if (!(file instanceof File) || file.size === 0) return null
  if (!file.type.startsWith("image/")) return "ERR_TYPE"
  if (file.size > MAX_BYTES) return "ERR_SIZE"
  const buffer = Buffer.from(await file.arrayBuffer())
  return `data:${file.type};base64,${buffer.toString("base64")}`
}

export async function completeRegistration(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const role = String(formData.get("role") ?? "") as Role
  if (!VALID_ROLES.includes(role)) redirect("/onboarding?error=role")

  const fullName = String(formData.get("fullName") ?? "").trim()
  if (fullName.length < 2) redirect("/onboarding?error=name")

  const phone = String(formData.get("phone") ?? "").trim()
  if (!/^[0-9+\-\s]{6,20}$/.test(phone)) redirect("/onboarding?error=phone")

  const nationalId = String(formData.get("nationalId") ?? "").trim()
  if (!/^\d{6,20}$/.test(nationalId)) redirect("/onboarding?error=nid")

  const city = String(formData.get("city") ?? "").trim() || null

  const front = await fileToDataUrl(formData.get("front"))
  const back = await fileToDataUrl(formData.get("back"))
  if (front === "ERR_TYPE" || back === "ERR_TYPE")
    redirect("/onboarding?error=type")
  if (front === "ERR_SIZE" || back === "ERR_SIZE")
    redirect("/onboarding?error=size")

  const email = u.emailAddresses?.[0]?.emailAddress ?? null
  const photoData: { idPhotoFrontUrl?: string; idPhotoBackUrl?: string } = {}
  if (typeof front === "string") photoData.idPhotoFrontUrl = front
  if (typeof back === "string") photoData.idPhotoBackUrl = back

  try {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { role, fullName, phone, nationalId, city, ...photoData },
      create: {
        id: u.id,
        role,
        fullName,
        email,
        phone,
        nationalId,
        city,
        ...photoData,
      },
    })
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "P2002") redirect("/onboarding?error=dup")
    redirect("/onboarding?error=fail")
  }

  // إنشاء الهوية الطبية + QR لو مش موجودة
  try {
    const existing = await prisma.medicalId.findUnique({
      where: { userId: u.id },
    })
    if (!existing) {
      await prisma.medicalId.create({
        data: { userId: u.id, qrCode: randomUUID() },
      })
    }
  } catch {}

  // تفعيل فوري — مراجعة لاحقة
  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(u.id, {
      publicMetadata: { role, status: "approved" },
    })
  } catch {}

  redirect("/id")
}
