"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

function clampPct(v: FormDataEntryValue | null) {
  const n = parseInt(String(v ?? "0"), 10)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export async function addPartnership(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const partnerName = String(formData.get("partnerName") || "").trim()
  const partnerType = String(formData.get("partnerType") || "").trim()
  const partnerPhone = String(formData.get("partnerPhone") || "").trim() || null
  const discountPct = clampPct(formData.get("discountPct"))
  const patientPct = clampPct(formData.get("patientPct"))
  const doctorPct = clampPct(formData.get("doctorPct"))
  const note = String(formData.get("note") || "").trim() || null

  if (!partnerName || !partnerType) {
    redirect("/profile/partnerships?error=missing")
  }

  try {
    await prisma.partnership.create({
      data: {
        ownerId: u.id,
        partnerName,
        partnerType,
        partnerPhone,
        discountPct,
        patientPct,
        doctorPct,
        note,
      },
    })
  } catch {}

  revalidatePath("/profile/partnerships")
  redirect("/profile/partnerships?saved=1")
}

export async function deletePartnership(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const id = String(formData.get("id") || "").trim()
  if (id) {
    try {
      await prisma.partnership.deleteMany({ where: { id, ownerId: u.id } })
    } catch {}
  }

  revalidatePath("/profile/partnerships")
  redirect("/profile/partnerships?deleted=1")
}
