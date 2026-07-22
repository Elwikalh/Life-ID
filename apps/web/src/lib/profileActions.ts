"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"

export async function saveProfile(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const meta = u.publicMetadata as { role?: Role }
  const role = meta.role ?? "patient"

  const specialty = String(formData.get("specialty") || "").trim() || null
  const bio = String(formData.get("bio") || "").trim() || null
  const feeRaw = String(formData.get("consultationFee") || "").trim()
  const parsedFee = feeRaw ? parseInt(feeRaw, 10) : NaN
  const consultationFee = Number.isFinite(parsedFee) ? Math.max(0, parsedFee) : null

  const email = u.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [u.firstName, u.lastName].filter(Boolean).join(" ") || email || "مستخدم"

  try {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { specialty, bio, consultationFee },
      create: {
        id: u.id,
        role,
        fullName,
        email,
        specialty,
        bio,
        consultationFee,
      },
    })
  } catch {}

  revalidatePath("/profile")
  redirect("/profile?saved=1")
}
