"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

function clampPct(v: FormDataEntryValue | null) {
  const n = parseInt(String(v ?? ""), 10)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

// الأنواع اللي تتحوّل لشراكة تلقائياً عند الاتفاق
const PARTNER_TYPES = new Set([
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
])

// مقدّم الخدمة يبدأ تفاوض مع جهة مسجّلة
export async function startNegotiation(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const inviteeUserId = String(formData.get("inviteeUserId") || "").trim()
  const message = String(formData.get("message") || "").trim() || null
  const proposedPct = clampPct(formData.get("proposedPct"))

  if (!inviteeUserId || inviteeUserId === u.id) {
    redirect("/negotiations?error=invalid")
  }

  let ok = false
  try {
    const invitee = await prisma.user.findUnique({
      where: { id: inviteeUserId },
      select: { id: true, fullName: true, role: true },
    })
    if (invitee) {
      await prisma.invitation.create({
        data: {
          inviterId: u.id,
          inviteeName: invitee.fullName,
          inviteeType: invitee.role,
          inviteeUserId: invitee.id,
          requestedPct: proposedPct,
          currentPct: proposedPct,
          lastActor: "inviter",
          status: "pending",
          message,
        },
      })
      ok = true
    }
  } catch {}

  revalidatePath("/negotiations")
  redirect(ok ? "/negotiations?ok=sent" : "/negotiations?error=fail")
}

// رد على التفاوض: موافقة / رفض / عرض مقابل
export async function respondNegotiation(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const id = String(formData.get("id") || "").trim()
  const decision = String(formData.get("decision") || "").trim()
  const counterPct = clampPct(formData.get("counterPct"))
  if (!id) redirect("/negotiations")

  let result = "fail"
  try {
    const inv = await prisma.invitation.findUnique({ where: { id } })
    if (inv && (inv.inviterId === u.id || inv.inviteeUserId === u.id)) {
      const isInviter = inv.inviterId === u.id
      const actor = isInviter ? "inviter" : "invitee"
      const isOpen = inv.status === "pending" || inv.status === "countered"
      const inviteeTurn =
        inv.status === "pending" ||
        (inv.status === "countered" && inv.lastActor === "inviter")
      const inviterTurn =
        inv.status === "countered" && inv.lastActor === "invitee"
      const myTurn = isInviter ? inviterTurn : inviteeTurn

      if (isOpen && myTurn) {
        if (decision === "accept") {
          await prisma.invitation.update({
            where: { id: inv.id },
            data: { status: "accepted", lastActor: actor },
          })
          if (PARTNER_TYPES.has(inv.inviteeType)) {
            const existing = await prisma.partnership.findFirst({
              where: {
                ownerId: inv.inviterId,
                partnerName: inv.inviteeName,
                partnerType: inv.inviteeType,
              },
            })
            if (!existing) {
              await prisma.partnership.create({
                data: {
                  ownerId: inv.inviterId,
                  partnerName: inv.inviteeName,
                  partnerType: inv.inviteeType,
                  discountPct: inv.currentPct ?? 0,
                  patientPct: 0,
                  doctorPct: 0,
                  note: "أُضيف تلقائياً بعد الاتفاق على الخصم",
                },
              })
            }
          }
          result = "accepted"
        } else if (decision === "reject") {
          await prisma.invitation.update({
            where: { id: inv.id },
            data: { status: "rejected", lastActor: actor },
          })
          result = "rejected"
        } else if (decision === "counter") {
          await prisma.invitation.update({
            where: { id: inv.id },
            data: {
              status: "countered",
              currentPct: counterPct,
              lastActor: actor,
            },
          })
          result = "countered"
        }
      }
    }
  } catch {}

  revalidatePath("/negotiations")
  redirect(
    result === "fail" ? "/negotiations?error=fail" : "/negotiations?ok=" + result,
  )
}

// المُرسِل يسحب عرض لسه مفتوح
export async function cancelNegotiation(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "").trim()
  if (id) {
    try {
      await prisma.invitation.deleteMany({
        where: { id, inviterId: u.id },
      })
    } catch {}
  }
  revalidatePath("/negotiations")
  redirect("/negotiations?ok=cancelled")
}
