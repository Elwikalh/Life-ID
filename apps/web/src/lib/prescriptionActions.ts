"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

export type RxItem = { drug: string; dosage: string }
export type OrderItem = { name: string; note: string }

// كل سطر يمثل عنصرًا. الصيغة: "الاسم - التفاصيل"
function parsePairs(raw: string): { a: string; b: string }[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(" - ")
      if (idx === -1) return { a: line, b: "" }
      return { a: line.slice(0, idx).trim(), b: line.slice(idx + 3).trim() }
    })
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) || "").trim()
}

export async function savePrescription(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const appointmentId = str(formData, "appointmentId")
  if (!appointmentId) return

  const items: RxItem[] = parsePairs(str(formData, "items")).map((p) => ({
    drug: p.a,
    dosage: p.b,
  }))
  const labRequests: OrderItem[] = parsePairs(str(formData, "labRequests")).map(
    (p) => ({ name: p.a, note: p.b }),
  )
  const imagingRequests: OrderItem[] = parsePairs(
    str(formData, "imagingRequests"),
  ).map((p) => ({ name: p.a, note: p.b }))

  const diagnosis = str(formData, "diagnosis") || null
  const clinicalNotes = str(formData, "clinicalNotes") || null
  const dangerNote = str(formData, "dangerNote") || null
  const emergencyPlan = str(formData, "emergencyPlan") || null
  const followUpNote = str(formData, "followUpNote") || null
  const followUpRaw = str(formData, "followUpAt")
  const followUpAt = followUpRaw ? new Date(followUpRaw) : null

  let ok = false
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { providerId: true, patientId: true },
    })
    // الطبيب/مقدم الخدمة صاحب الحجز فقط هو من يكتب الكشف
    if (appt && appt.providerId === u.id) {
      const data = {
        items,
        labRequests,
        imagingRequests,
        diagnosis,
        clinicalNotes,
        dangerNote,
        emergencyPlan,
        followUpNote,
        followUpAt,
        doctorId: u.id,
        patientId: appt.patientId,
      }
      await prisma.prescription.upsert({
        where: { appointmentId },
        update: data,
        create: { appointmentId, ...data },
      })
      ok = true
    }
  } catch {}

  revalidatePath("/rx/" + appointmentId)
  if (ok) redirect("/rx/" + appointmentId)
}
