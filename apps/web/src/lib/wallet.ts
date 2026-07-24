import { prisma } from "@life-id/db"

// كل المبالغ بالجنيه المصري كأرقام صحيحة (زي priceEGP)

// إنشاء/جلب محفظة المستخدم
export async function ensureWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

// ===== بيانات حساب استقبال الفلوس (للدكتور) =====
export type PayoutDetails = {
  payoutName?: string | null
  payoutInstapay?: string | null
  payoutMobile?: string | null
  payoutBank?: string | null
  payoutAccount?: string | null
  payoutNote?: string | null
}

export async function savePayoutDetails(userId: string, d: PayoutDetails) {
  const data = {
    payoutName: d.payoutName ?? null,
    payoutInstapay: d.payoutInstapay ?? null,
    payoutMobile: d.payoutMobile ?? null,
    payoutBank: d.payoutBank ?? null,
    payoutAccount: d.payoutAccount ?? null,
    payoutNote: d.payoutNote ?? null,
  }
  return prisma.wallet.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })
}

export async function getPayoutDetails(userId: string) {
  const w = await prisma.wallet.findUnique({ where: { userId } })
  return {
    payoutName: w?.payoutName ?? "",
    payoutInstapay: w?.payoutInstapay ?? "",
    payoutMobile: w?.payoutMobile ?? "",
    payoutBank: w?.payoutBank ?? "",
    payoutAccount: w?.payoutAccount ?? "",
    payoutNote: w?.payoutNote ?? "",
  }
}

// ===== الإشعارات =====
type NotifyMeta = {
  title: string
  body?: string | null
  type?: string
  href?: string | null
}

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

// ===== تسجيل الدَّين (استحقاق الدكتور عند الشريك) =====
export async function accrueDebt(args: {
  creditorId: string // الدكتور المستحق
  debtorId: string // الشريك المدين
  amount: number
  refType?: string | null
  refId?: string | null
  description?: string | null
}) {
  const amount = Math.round(args.amount)
  if (!amount || amount <= 0) return null
  if (!args.creditorId || !args.debtorId) return null
  if (args.creditorId === args.debtorId) return null

  // منع التكرار لنفس المرجع
  if (args.refType && args.refId) {
    const existing = await prisma.debt.findFirst({
      where: { refType: args.refType, refId: args.refId },
    })
    if (existing) return existing
  }

  const debt = await prisma.debt.create({
    data: {
      creditorId: args.creditorId,
      debtorId: args.debtorId,
      amount,
      refType: args.refType ?? null,
      refId: args.refId ?? null,
      description: args.description ?? null,
    },
  })

  await notify(args.debtorId, {
    title: "مستحق جديد عليك",
    body: "تم تسجيل " + amount + " ج.م مستحقة للطبيب على محفظتك",
    type: "debt",
    href: "/profile/wallet",
  })

  return debt
}

// ===== كشف حساب الدكتور: مجمّع حسب كل شريك =====
export async function getDoctorLedger(doctorId: string) {
  const debts = await prisma.debt.findMany({
    where: {
      creditorId: doctorId,
      status: { in: ["open", "requested", "sent"] },
    },
    include: { debtor: { select: { id: true, fullName: true, role: true } } },
    orderBy: { createdAt: "desc" },
  })

  type Group = {
    partnerId: string
    partnerName: string
    partnerRole: string
    total: number
    open: number
    requested: number
    sent: number
    count: number
  }
  const groups = new Map<string, Group>()

  for (const d of debts) {
    const g: Group = groups.get(d.debtorId) ?? {
      partnerId: d.debtorId,
      partnerName: d.debtor?.fullName ?? "شريك",
      partnerRole: d.debtor?.role ?? "",
      total: 0,
      open: 0,
      requested: 0,
      sent: 0,
      count: 0,
    }
    g.total += d.amount
    g.count += 1
    if (d.status === "open") g.open += d.amount
    else if (d.status === "requested") g.requested += d.amount
    else if (d.status === "sent") g.sent += d.amount
    groups.set(d.debtorId, g)
  }

  const partners = Array.from(groups.values()).sort((a, b) => b.total - a.total)
  const total = partners.reduce((s, p) => s + p.total, 0)
  return { total, partners }
}

// ===== كشف حساب الشريك: اللي عليه للأطباء =====
export async function getPartnerLedger(partnerId: string) {
  const debts = await prisma.debt.findMany({
    where: {
      debtorId: partnerId,
      status: { in: ["open", "requested", "sent"] },
    },
    include: { creditor: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  })
  const requests = await prisma.payoutRequest.findMany({
    where: { partnerId, status: { in: ["requested", "sent"] } },
    include: { doctor: { select: { id: true, fullName: true } } },
    orderBy: { requestedAt: "desc" },
  })
  const total = debts.reduce((s, d) => s + d.amount, 0)
  return { total, debts, requests }
}

// ===== الدكتور يطلب صرف مستحقاته من شريك معيّن =====
export async function requestPayout(doctorId: string, partnerId: string) {
  const open = await prisma.debt.findMany({
    where: { creditorId: doctorId, debtorId: partnerId, status: "open" },
  })
  if (open.length === 0) return { ok: false, reason: "nothing" }
  const amount = open.reduce((s, d) => s + d.amount, 0)
  if (amount <= 0) return { ok: false, reason: "nothing" }

  const details = await getPayoutDetails(doctorId)
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    select: { fullName: true },
  })

  const payout = await prisma.payoutRequest.create({
    data: { doctorId, partnerId, amount, status: "requested" },
  })

  await prisma.debt.updateMany({
    where: { creditorId: doctorId, debtorId: partnerId, status: "open" },
    data: { status: "requested", payoutId: payout.id },
  })

  const lines = [
    details.payoutName ? "الاسم: " + details.payoutName : "",
    details.payoutInstapay ? "انستاباي: " + details.payoutInstapay : "",
    details.payoutMobile ? "محفظة موبايل: " + details.payoutMobile : "",
    details.payoutBank ? "البنك: " + details.payoutBank : "",
    details.payoutAccount ? "الحساب: " + details.payoutAccount : "",
    details.payoutNote ? "ملاحظة: " + details.payoutNote : "",
  ].filter(Boolean)

  await notify(partnerId, {
    title: "طلب صرف من " + (doctor?.fullName ?? "طبيب"),
    body:
      "المطلوب: " +
      amount +
      " ج.م. بيانات الاستقبال: " +
      (lines.join(" | ") || "لم يحدّد الطبيب بيانات استقبال بعد"),
    type: "payout",
    href: "/profile/wallet",
  })

  return { ok: true, payoutId: payout.id, amount }
}

// ===== الشريك يعلّم إنه أرسل الفلوس =====
export async function markPayoutSent(payoutId: string, partnerId: string) {
  const p = await prisma.payoutRequest.findUnique({ where: { id: payoutId } })
  if (!p || p.partnerId !== partnerId) return { ok: false, reason: "denied" }
  if (p.status !== "requested") return { ok: false, reason: "state" }

  await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: { status: "sent", sentAt: new Date() },
  })
  await prisma.debt.updateMany({
    where: { payoutId, status: "requested" },
    data: { status: "sent" },
  })

  await notify(p.doctorId, {
    title: "تم إرسال مستحقاتك",
    body: "الشريك أرسل " + p.amount + " ج.م. أكّد الاستلام من محفظتك.",
    type: "payout",
    href: "/profile/wallet",
  })
  return { ok: true }
}

// ===== الدكتور يؤكّد استلام الفلوس =====
export async function confirmPayoutReceived(
  payoutId: string,
  doctorId: string,
) {
  const p = await prisma.payoutRequest.findUnique({ where: { id: payoutId } })
  if (!p || p.doctorId !== doctorId) return { ok: false, reason: "denied" }
  if (p.status !== "sent" && p.status !== "requested")
    return { ok: false, reason: "state" }

  const now = new Date()
  await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: { status: "received", receivedAt: now },
  })
  await prisma.debt.updateMany({
    where: { payoutId },
    data: { status: "settled", settledAt: now },
  })

  await notify(p.partnerId, {
    title: "تم تأكيد استلام المبلغ",
    body: "الطبيب أكّد استلام " + p.amount + " ج.م. تم تصفية المستحقات.",
    type: "payout",
    href: "/profile/wallet",
  })
  return { ok: true }
}
