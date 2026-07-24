"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"
import { accrueDebt } from "./wallet"

type OrderItem = { name: string; note: string }

function parseItems(raw: string): OrderItem[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => {
        const o = (x ?? {}) as { name?: unknown; note?: unknown }
        return {
          name: String(o.name ?? "").trim(),
          note: String(o.note ?? "").trim(),
        }
      })
      .filter((x) => x.name)
  } catch {
    return []
  }
}

// الطبيب يوجّه طلب تحاليل/أشعة لجهة شريكة
export async function routeServiceOrder(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const prescriptionId = String(formData.get("prescriptionId") || "").trim()
  const appointmentId = String(formData.get("appointmentId") || "").trim()
  const partnerUserId = String(formData.get("partnerUserId") || "").trim()
  const type = String(formData.get("type") || "").trim()
  const items = parseItems(String(formData.get("items") || "[]"))
  const back = appointmentId ? "/rx/" + appointmentId : "/dashboard"

  if (
    !prescriptionId ||
    !partnerUserId ||
    (type !== "lab" && type !== "radiology")
  ) {
    redirect(back + "?error=route")
  }

  let ok = false
  try {
    const rx = await prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: u.id },
      select: { id: true, patientId: true },
    })
    const partner = await prisma.user.findFirst({
      where: {
        id: partnerUserId,
        role: type === "lab" ? "lab" : "radiology",
      },
      select: { id: true, fullName: true },
    })
    if (rx && partner) {
      const existing = await prisma.serviceOrder.findFirst({
        where: {
          prescriptionId: rx.id,
          type: type === "lab" ? "lab" : "radiology",
          partnerUserId: partner.id,
          status: { in: ["routed", "accepted", "done"] },
        },
        select: { id: true },
      })
      if (!existing) {
        await prisma.serviceOrder.create({
          data: {
            prescriptionId: rx.id,
            doctorId: u.id,
            patientId: rx.patientId,
            partnerUserId: partner.id,
            partnerName: partner.fullName,
            type: type === "lab" ? "lab" : "radiology",
            items,
            status: "routed",
          },
        })
        ok = true
      }
    }
  } catch {}

  revalidatePath(back)
  redirect(back + (ok ? "?ok=routed" : "?error=route"))
}

// الجهة تقبل الطلب
export async function acceptServiceOrder(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "").trim()
  if (!id) redirect("/service-inbox")
  try {
    await prisma.serviceOrder.updateMany({
      where: { id, partnerUserId: u.id, status: "routed" },
      data: { status: "accepted" },
    })
  } catch {}
  revalidatePath("/service-inbox")
  redirect("/service-inbox?ok=accepted")
}

// الجهة ترفض الطلب
export async function cancelServiceOrder(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "").trim()
  if (!id) redirect("/service-inbox")
  try {
    await prisma.serviceOrder.updateMany({
      where: {
        id,
        partnerUserId: u.id,
        status: { in: ["routed", "accepted"] },
      },
      data: { status: "cancelled" },
    })
  } catch {}
  revalidatePath("/service-inbox")
  redirect("/service-inbox?ok=cancelled")
}

// الجهة تقفل الطلب بالفاتورة + استحقاق تلقائي للطبيب
export async function completeServiceOrder(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "").trim()
  if (!id) redirect("/service-inbox")

  const totalRaw = String(formData.get("invoiceTotal") || "").trim()
  const totalNum = totalRaw ? Number(totalRaw) : 0
  const invoiceTotal =
    Number.isFinite(totalNum) && totalNum > 0 ? Math.round(totalNum) : 0

  try {
    const order = await prisma.serviceOrder.findFirst({
      where: {
        id,
        partnerUserId: u.id,
        status: { in: ["routed", "accepted"] },
      },
      select: { id: true, doctorId: true, type: true },
    })

    if (order) {
      await prisma.serviceOrder.update({
        where: { id: order.id },
        data: {
          status: "done",
          doneAt: new Date(),
          invoiceTotal: invoiceTotal || null,
        },
      })

      if (invoiceTotal > 0 && order.doctorId) {
        const partnership = await prisma.partnership.findFirst({
          where: { ownerId: order.doctorId, partnerUserId: u.id },
          select: { doctorPct: true },
        })
        const pct = partnership?.doctorPct ?? 0
        const amount = Math.round((invoiceTotal * pct) / 100)
        if (amount > 0) {
          const label = order.type === "lab" ? "تحاليل" : "أشعة"
          await accrueDebt({
            creditorId: order.doctorId,
            debtorId: u.id,
            amount,
            refType: "service_order",
            refId: order.id,
            description: `عمولة ${label} (${pct}% من ${invoiceTotal} ج.م)`,
          })
        }
      }
    }
  } catch {}

  revalidatePath("/service-inbox")
  redirect("/service-inbox?ok=done")
}
