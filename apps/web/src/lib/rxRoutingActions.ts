"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

function clampPriority(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1
  if (n > 99) return 99
  return Math.round(n)
}

// الطبيب يربط صيدلية بالأولوية
export async function linkPharmacy(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const pharmacyId = String(formData.get("pharmacyId") || "")
  const priority = clampPriority(Number(formData.get("priority") || "1"))
  if (!pharmacyId) redirect("/pharmacies?error=empty")

  let ok = false
  try {
    const pharmacy = await prisma.user.findFirst({
      where: { id: pharmacyId, role: "pharmacy" },
      select: { id: true, fullName: true },
    })
    if (pharmacy) {
      await prisma.pharmacyLink.upsert({
        where: { doctorId_pharmacyId: { doctorId: u.id, pharmacyId } },
        update: { priority, pharmacyName: pharmacy.fullName },
        create: {
          doctorId: u.id,
          pharmacyId,
          pharmacyName: pharmacy.fullName,
          priority,
        },
      })
      ok = true
    }
  } catch {}

  revalidatePath("/pharmacies")
  redirect(ok ? "/pharmacies?ok=linked" : "/pharmacies?error=fail")
}

// الطبيب يشيل صيدلية من قائمته
export async function unlinkPharmacy(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "")
  if (!id) redirect("/pharmacies")
  try {
    await prisma.pharmacyLink.deleteMany({ where: { id, doctorId: u.id } })
  } catch {}
  revalidatePath("/pharmacies")
  redirect("/pharmacies?ok=removed")
}

// الطبيب يوجّه روشتة للصيدلية الأولى بالأولوية
export async function routePrescription(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const prescriptionId = String(formData.get("prescriptionId") || "")
  if (!prescriptionId) redirect("/pharmacies")

  let ok = false
  let reason = "fail"
  try {
    const rx = await prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: u.id },
      select: { id: true },
    })
    if (!rx) {
      reason = "notfound"
    } else {
      const links = await prisma.pharmacyLink.findMany({
        where: { doctorId: u.id },
        orderBy: { priority: "asc" },
        select: { pharmacyId: true },
      })
      if (links.length === 0) {
        reason = "nopharmacy"
      } else {
        const first = links[0].pharmacyId
        await prisma.prescription.update({
          where: { id: prescriptionId },
          data: {
            status: "routed",
            currentPharmacyId: first,
            triedPharmacyIds: [first],
          },
        })
        ok = true
      }
    }
  } catch {}

  revalidatePath("/pharmacies")
  redirect(ok ? "/pharmacies?ok=routed" : "/pharmacies?error=" + reason)
}

// الصيدلية ترد: متوفّر أو ناقص (يتحوّل للتالية)
export async function pharmacyRespond(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const prescriptionId = String(formData.get("prescriptionId") || "")
  const decision = String(formData.get("decision") || "")
  if (!prescriptionId) redirect("/pharmacy-inbox")

  let redirectTo = "/pharmacy-inbox?error=fail"
  try {
    const rx = await prisma.prescription.findFirst({
      where: { id: prescriptionId, currentPharmacyId: u.id, status: "routed" },
      select: { id: true, doctorId: true, triedPharmacyIds: true },
    })
    if (rx) {
      if (decision === "available") {
        await prisma.prescription.update({
          where: { id: prescriptionId },
          data: { status: "accepted" },
        })
        redirectTo = "/pharmacy-inbox?ok=accepted"
      } else {
        const links = await prisma.pharmacyLink.findMany({
          where: { doctorId: rx.doctorId },
          orderBy: { priority: "asc" },
          select: { pharmacyId: true },
        })
        const tried = new Set(rx.triedPharmacyIds)
        const next = links.find((l) => !tried.has(l.pharmacyId))
        if (next) {
          await prisma.prescription.update({
            where: { id: prescriptionId },
            data: {
              status: "routed",
              currentPharmacyId: next.pharmacyId,
              triedPharmacyIds: { push: next.pharmacyId },
            },
          })
          redirectTo = "/pharmacy-inbox?ok=forwarded"
        } else {
          await prisma.prescription.update({
            where: { id: prescriptionId },
            data: { status: "unavailable", currentPharmacyId: null },
          })
          redirectTo = "/pharmacy-inbox?ok=nostock"
        }
      }
    }
  } catch {}

  revalidatePath("/pharmacy-inbox")
  redirect(redirectTo)
}

// الصيدلية تسجّل التسليم
export async function markDelivered(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const prescriptionId = String(formData.get("prescriptionId") || "")
  if (!prescriptionId) redirect("/pharmacy-inbox")
  try {
    await prisma.prescription.updateMany({
      where: {
        id: prescriptionId,
        currentPharmacyId: u.id,
        status: "confirmed",
      },
      data: { status: "delivered" },
    })
  } catch {}
  revalidatePath("/pharmacy-inbox")
  redirect("/pharmacy-inbox?ok=delivered")
}

// المريض يأكّد الاستلام ويختار طريقة الاستلام
export async function patientConfirm(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const prescriptionId = String(formData.get("prescriptionId") || "")
  const method = String(formData.get("method") || "pickup")
  const address = String(formData.get("address") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  if (!prescriptionId) redirect("/my-prescriptions")

  const deliveryMethod = method === "home" ? "home" : "pickup"
  if (deliveryMethod === "home" && !address) {
    redirect("/my-prescriptions?error=address")
  }

  let ok = false
  try {
    const rx = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: u.id, status: "accepted" },
      select: { id: true },
    })
    if (rx) {
      await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: "confirmed",
          deliveryMethod,
          patientAddress: deliveryMethod === "home" ? address : null,
          patientPhone: phone || null,
        },
      })
      ok = true
    }
  } catch {}

  revalidatePath("/my-prescriptions")
  redirect(ok ? "/my-prescriptions?ok=confirmed" : "/my-prescriptions?error=fail")
}
