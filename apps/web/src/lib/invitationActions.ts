"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

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
  if (id) {
    try {
      await prisma.invitation.updateMany({
        where: { id, inviterId: u.id },
        data: { status: "joined" },
      })
    } catch {}
  }

  revalidatePath("/profile/invitations")
  redirect("/profile/invitations?joined=1")
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
