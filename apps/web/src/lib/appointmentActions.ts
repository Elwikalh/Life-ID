"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@life-id/db"

type Status = "pending" | "confirmed" | "completed" | "cancelled"

// الحالات المسموح لمقدم الخدمة يحوّل ليها
const ALLOWED: Status[] = ["confirmed", "completed", "cancelled"]

export async function setAppointmentStatus(formData: FormData) {
  const u = await currentUser()
  if (!u) return
  const id = String(formData.get("id") || "")
  const status = String(formData.get("status") || "") as Status
  if (!id || !ALLOWED.includes(status)) return
  try {
    // تأكد إن الحجز تبع مقدم الخدمة الحالي قبل التعديل
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: { providerId: true },
    })
    if (appt && appt.providerId === u.id) {
      await prisma.appointment.update({ where: { id }, data: { status } })
    }
  } catch {}
  revalidatePath("/dashboard")
}
