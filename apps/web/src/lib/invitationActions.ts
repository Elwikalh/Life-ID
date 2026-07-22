"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

// أنواع المدعوين اللي يتحوّلوا لشركاء عند قبول الدعوة (مقدمو الخدمة).
// «زميل طبيب» ترشيح فقط بدون عمولة، فمش بيتسجّل كشريك.
const PARTNER_TYPES = new Set([
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
])

export async function sendInvitation(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const inviteeName = String(formData.get("inviteeName") || "").trim()
  const inviteeType = String(formData.get("inviteeType") || "").trim()
  const contact = String(formData.get("contact") || "").trim() || null
  const message = String(formData.get("message") || "").trim() || null

  const rawPct = String(formData.get("requestedPct") || "").trim()
  let requestedPct: number | null = null
  if (rawPct !== "") {
    const n = parseInt(rawPct, 10)
    if (Number.isFinite(n)) requestedPct = Math.min(100, Math.max(0, n))
  }

  if (!inviteeName || !inviteeType) {
    redirect("/profile/invitations?error=missing")
  }

  try {
    await prisma.invitation.create({
      data: {
        inviterId: u.id,
        inviteeName,
        inviteeType,
        contact,
        requestedPct,
        message,
        status: "pending",
      },
    })
  } catch {}

  revalidatePath("/profile/invitations")
  redirect("/profile/invitations?sent=1")
}

export async function markJoined(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const id = String(formData.get("id") || "").trim()
  if (!id) {
    redirect("/profile/invitations?joined=1")
  }

  let becamePartner = false

  try {
    // نجيب الدعوة الأول عشان نعرف نوعها وبياناتها
    const inv = await prisma.invitation.findFirst({
      where: { id, inviterId: u.id },
    })

    if (inv && inv.status !== "joined") {
      // نعلّمها كمُنضم
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { status: "joined" },
      })

      // لو المدعو مقدم خدمة → نحوّله تلقائياً لشريك
      if (PARTNER_TYPES.has(inv.inviteeType)) {
        const existing = await prisma.partnership.findFirst({
          where: {
            ownerId: u.id,
            partnerName: inv.inviteeName,
            partnerType: inv.inviteeType,
          },
        })

        if (!existing) {
          await prisma.partnership.create({
            data: {
              ownerId: u.id,
              partnerName: inv.inviteeName,
              partnerType: inv.inviteeType,
              partnerPhone: inv.contact,
              discountPct: inv.requestedPct ?? 0,
              patientPct: 0,
              doctorPct: 0,
              note: "أُضيف تلقائياً عند قبول الدعوة",
            },
          })
          becamePartner = true
        }
      }
    }
  } catch {}

  revalidatePath("/profile/invitations")
  revalidatePath("/profile/partnerships")
  redirect(
    becamePartner
      ? "/profile/invitations?joined=1&partner=1"
      : "/profile/invitations?joined=1",
  )
}

export async function deleteInvitation(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const id = String(formData.get("id") || "").trim()
  if (id) {
    try {
      await prisma.invitation.deleteMany({ where: { id, inviterId: u.id } })
    } catch {}
  }

  revalidatePath("/profile/invitations")
  redirect("/profile/invitations?deleted=1")
}
