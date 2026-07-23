"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

function clampRating(n: number) {
  if (!Number.isFinite(n)) return 0
  if (n < 1) return 1
  if (n > 5) return 5
  return Math.round(n)
}

export async function submitReview(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const providerId = String(formData.get("providerId") || "")
  const rating = clampRating(Number(formData.get("rating") || "0"))
  const comment = String(formData.get("comment") || "").trim()
  if (!providerId || rating < 1) redirect("/reviews?error=invalid")

  let redirectTo = "/reviews?error=fail"
  try {
    // لازم تكون فيه زيارة مكتملة مع مقدم الخدمة ده
    const visit = await prisma.appointment.findFirst({
      where: { patientId: u.id, providerId, status: "completed" },
      select: { id: true },
    })
    if (!visit) {
      redirectTo = "/reviews?error=notallowed"
    } else {
      const patientName =
        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.emailAddresses?.[0]?.emailAddress ||
        "مريض"
      await prisma.review.upsert({
        where: { providerId_patientId: { providerId, patientId: u.id } },
        update: { rating, comment: comment || null, patientName },
        create: {
          providerId,
          patientId: u.id,
          patientName,
          rating,
          comment: comment || null,
        },
      })
      redirectTo = "/reviews?ok=saved"
    }
  } catch {
    redirectTo = "/reviews?error=fail"
  }

  revalidatePath("/reviews")
  redirect(redirectTo)
}

export async function deleteReview(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const providerId = String(formData.get("providerId") || "")
  if (!providerId) redirect("/reviews")
  try {
    await prisma.review.deleteMany({
      where: { providerId, patientId: u.id },
    })
  } catch {}
  revalidatePath("/reviews")
  redirect("/reviews?ok=deleted")
}
