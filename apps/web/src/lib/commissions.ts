import { prisma } from "@life-id/db"

function clamp(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 100) return 100
  return Math.round(n)
}

export type CommissionSplit = {
  amount: number
  discountPct: number
  patientPct: number
  doctorPct: number
  discountAmount: number
  patientSaves: number
  doctorEarns: number
  patientPays: number
  balanced: boolean
  overAllocated: boolean
}

// محرك حساب تقسيم الخصم على فاتورة معينة
export function computeSplit(
  amount: number,
  discountPct: number,
  patientPct: number,
  doctorPct: number,
): CommissionSplit {
  const a = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0
  const disc = clamp(discountPct)
  const pat = clamp(patientPct)
  const doc = clamp(doctorPct)
  const discountAmount = Math.round((a * disc) / 100)
  const patientSaves = Math.round((a * pat) / 100)
  const doctorEarns = Math.round((a * doc) / 100)
  const patientPays = Math.max(0, a - patientSaves)
  const allocated = pat + doc
  return {
    amount: a,
    discountPct: disc,
    patientPct: pat,
    doctorPct: doc,
    discountAmount,
    patientSaves,
    doctorEarns,
    patientPays,
    balanced: allocated === disc,
    overAllocated: allocated > disc,
  }
}

export type PartnershipRecord = {
  id: string
  partnerName: string
  partnerType: string
  discountPct: number
  patientPct: number
  doctorPct: number
}

export type CommissionOverview = {
  count: number
  avgDiscount: number
  avgPatient: number
  avgDoctor: number
  imbalanced: number
  partnerships: PartnershipRecord[]
}

export async function getCommissionOverview(
  ownerId: string,
): Promise<CommissionOverview> {
  const empty: CommissionOverview = {
    count: 0,
    avgDiscount: 0,
    avgPatient: 0,
    avgDoctor: 0,
    imbalanced: 0,
    partnerships: [],
  }
  try {
    const rows = await prisma.partnership.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        partnerName: true,
        partnerType: true,
        discountPct: true,
        patientPct: true,
        doctorPct: true,
      },
    })
    if (rows.length === 0) return empty
    let d = 0
    let p = 0
    let dr = 0
    let imbalanced = 0
    for (const r of rows) {
      d += r.discountPct
      p += r.patientPct
      dr += r.doctorPct
      if (r.patientPct + r.doctorPct !== r.discountPct) imbalanced++
    }
    const n = rows.length
    return {
      count: n,
      avgDiscount: Math.round(d / n),
      avgPatient: Math.round(p / n),
      avgDoctor: Math.round(dr / n),
      imbalanced,
      partnerships: rows,
    }
  } catch {
    return empty
  }
}
