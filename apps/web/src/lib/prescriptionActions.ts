"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

export type RxItem = { drug: string; dosage: string }

export async function savePrescription(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const appointmentId = String(formData.get("appointmentId") || "")
  const raw = String(formData.get("items") || "")
  if (!appointmentId) return

  // كل سطر = دواء واحد بصيغة "الدواء - الجرعة"
  const items: RxItem[] = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(" - ")
      if (idx === -1) return { drug: line, dosage: "" }
      return { drug: line.slice(0, idx).trim(), dosage: line.slice(idx + 3).trim() }
    })

  let ok = false
  try {
    // تأكد إن الحجز تبع مقدم الخدمة الحالي
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { providerId: true },
    })
    if (appt && appt.providerId === u.id) {
      await prisma.prescription.upsert({
        where: { appointmentId },
        update: { items, doctorId: u.id },
        create: { appointmentId, doctorId: u.id, items },
      })
      ok = true
    }
  } catch {}

  revalidatePath("/rx/" + appointmentId)
  if (ok) redirect("/rx/" + appointmentId)
}
