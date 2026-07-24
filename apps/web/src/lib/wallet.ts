import { prisma } from "@life-id/db"

// كل المبالغ بالجنيه المصري كأرقام صحيحة (زي priceEGP)
// نسبة عمولة المنصة على صافي الإيراد
export const PLATFORM_COMMISSION_RATE = 0.1

type TxType =
  | "commission"
  | "earning"
  | "payout"
  | "refund"
  | "adjustment"
  | "topup"

type TxMeta = {
  type: TxType
  description?: string | null
  refType?: string | null
  refId?: string | null
}

// إنشاء محفظة للمستخدم لو مش موجودة
export async function ensureWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

// إضافة رصيد + تسجيل حركة (عملية ذرّية)
export async function walletCredit(userId: string, amount: number, meta: TxMeta) {
  const amt = Math.round(amount)
  if (!Number.isFinite(amt) || amt <= 0) return null
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
    const txn = await tx.walletTx.create({
      data: {
        walletId: wallet.id,
        amount: amt,
        type: meta.type,
        description: meta.description ?? null,
        refType: meta.refType ?? null,
        refId: meta.refId ?? null,
      },
    })
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amt } },
    })
    return txn
  })
}

// خصم رصيد + تسجيل حركة (عملية ذرّية)
export async function walletDebit(userId: string, amount: number, meta: TxMeta) {
  const amt = Math.round(amount)
  if (!Number.isFinite(amt) || amt <= 0) return null
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
    const txn = await tx.walletTx.create({
      data: {
        walletId: wallet.id,
        amount: -amt,
        type: meta.type,
        description: meta.description ?? null,
        refType: meta.refType ?? null,
        refId: meta.refId ?? null,
      },
    })
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amt } },
    })
    return txn
  })
}

// قراءة المحفظة مع آخر الحركات
export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { txns: { orderBy: { createdAt: "desc" }, take: 30 } },
  })
  return {
    balance: wallet?.balance ?? 0,
    currency: wallet?.currency ?? "EGP",
    txns: wallet?.txns ?? [],
  }
}

type NotifyMeta = {
  title: string
  body?: string | null
  type?: string
  href?: string | null
}

// إرسال إشعار لمستخدم
export async function notify(userId: string, meta: NotifyMeta) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title: meta.title,
        body: meta.body ?? null,
        type: meta.type ?? "info",
        href: meta.href ?? null,
      },
    })
  } catch {
    return null
  }
}

export type SettleResult = {
  ok: boolean
  reason?: string
  already?: boolean
  payout?: number
  commission?: number
}

// تسوية حجز مكتمل: يحسب الصافي والعمولة ويضيف الدخل لمحفظة مقدّم الخدمة
// العملية آمنة للتكرار (idempotent): مش هتتحسب مرتين لنفس الحجز
export async function settleAppointment(
  appointmentId: string,
): Promise<SettleResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      provider: { select: { id: true, fullName: true } },
      patient: { select: { id: true, fullName: true } },
    },
  })
  if (!appt) return { ok: false, reason: "notfound" }
  if (appt.status !== "completed") return { ok: false, reason: "not_completed" }

  // منع الحساب المكرر لنفس الحجز
  const existing = await prisma.walletTx.findFirst({
    where: { refType: "appointment", refId: appt.id, type: "earning" },
  })
  if (existing) return { ok: true, already: true }

  const gross = appt.priceEGP ?? 0
  const discount = Math.round((gross * (appt.discountPct ?? 0)) / 100)
  const net = Math.max(0, gross - discount)
  if (net <= 0) return { ok: true, payout: 0, commission: 0 }

  const commission = Math.round(net * PLATFORM_COMMISSION_RATE)
  const payout = net - commission
  const patientName = appt.patient?.fullName ?? "مريض"
  const providerName = appt.provider?.fullName ?? "مقدّم الخدمة"

  await walletCredit(appt.providerId, payout, {
    type: "earning",
    description: "صافي كشف - " + patientName,
    refType: "appointment",
    refId: appt.id,
  })

  await notify(appt.providerId, {
    title: "دخل جديد في محفظتك",
    body: "تمت إضافة " + payout + " ج.م من كشف " + patientName,
    type: "wallet",
    href: "/profile/commissions",
  })

  await notify(appt.patientId, {
    title: "تم اكتمال زيارتك",
    body: "شكراً لزيارتك " + providerName,
    type: "appointment",
    href: "/appointments",
  })

  return { ok: true, payout, commission }
}
