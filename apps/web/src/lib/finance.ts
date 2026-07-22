import { prisma } from "@life-id/db"

export type FinanceTxn = {
  id: string
  patientName: string
  providerName: string
  gross: number
  discountPct: number
  net: number
  status: string
  date: Date
}

export type FinanceSummary = {
  gross: number
  discounts: number
  net: number
  commission: number
  payout: number
  txnCount: number
  monthlyNet: number[]
  transactions: FinanceTxn[]
}

// نسبة عمولة المنصة على صافي الإيراد
const COMMISSION_RATE = 0.1

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const empty: FinanceSummary = {
    gross: 0,
    discounts: 0,
    net: 0,
    commission: 0,
    payout: 0,
    txnCount: 0,
    monthlyNet: Array(12).fill(0),
    transactions: [],
  }

  try {
    const appts = await prisma.appointment.findMany({
      include: {
        patient: { select: { fullName: true } },
        provider: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    const monthlyNet: number[] = Array(12).fill(0)
    const year = new Date().getFullYear()
    let gross = 0
    let discounts = 0

    const transactions: FinanceTxn[] = appts.map((a) => {
      const g = a.priceEGP
      const d = Math.round((g * a.discountPct) / 100)
      const net = g - d
      gross += g
      discounts += d
      const created = new Date(a.createdAt)
      if (created.getFullYear() === year) {
        monthlyNet[created.getMonth()] += net
      }
      return {
        id: a.id,
        patientName: a.patient?.fullName ?? "—",
        providerName: a.provider?.fullName ?? "—",
        gross: g,
        discountPct: a.discountPct,
        net,
        status: a.status,
        date: created,
      }
    })

    const net = gross - discounts
    const commission = Math.round(net * COMMISSION_RATE)
    const payout = net - commission

    return {
      gross,
      discounts,
      net,
      commission,
      payout,
      txnCount: appts.length,
      monthlyNet,
      transactions: transactions.slice(0, 50),
    }
  } catch {
    return empty
  }
}
