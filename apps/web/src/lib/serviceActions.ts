"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

// ملف "use server" ممكن يصدّر دوال async بس، عشان كدا WORK_DAYS محلية (مفيش export).
const WORK_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
]

export async function saveService(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const branchesRaw = String(formData.get("branchesCount") || "").trim()
  const parsedBranches = branchesRaw ? parseInt(branchesRaw, 10) : NaN
  const branchesCount = Number.isFinite(parsedBranches)
    ? Math.min(50, Math.max(1, parsedBranches))
    : null

  const city = String(formData.get("city") || "").trim() || null
  const clinicLocation =
    String(formData.get("clinicLocation") || "").trim() || null
  const workingDays = WORK_DAYS.filter((d) => formData.get("day_" + d) === "on")
  const workFrom = String(formData.get("workFrom") || "").trim() || null
  const workTo = String(formData.get("workTo") || "").trim() || null
  const homeService = formData.get("homeService") === "yes"
  const paymentPolicy =
    String(formData.get("paymentPolicy") || "").trim() || null

  try {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        branchesCount,
        city,
        clinicLocation,
        workingDays,
        workFrom,
        workTo,
        homeService,
        paymentPolicy,
      },
    })
  } catch {}

  revalidatePath("/profile/service")
  redirect("/profile/service?saved=1")
}
