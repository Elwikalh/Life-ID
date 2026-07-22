import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@life-id/db"
import { Info } from "lucide-react"

export const dynamic = "force-dynamic"

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
]

// بيانات عينة للرسوم لحين توفر بيانات مالية حقيقية
const sampleRevenue = [30, 42, 38, 50, 46, 62, 70, 58, 66, 54, 72, 84]
const sampleExpenses = [22, 30, 26, 34, 28, 40, 44, 36, 42, 32, 46, 52]
const sampleProfit = [8, 12, 12, 16, 18, 22, 26, 22, 24, 22, 26, 32]

async function getStats() {
  const result = {
    totalUsers: 0,
    appointments: 0,
    revenue: 0,
    pending: 0,
    counts: {} as Record<string, number>,
    topProviders: [] as Array<{ name: string; count: number }>,
  }

  try {
    const byRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } })
    for (const row of byRole) result.counts[row.role as string] = row._count._all
    result.totalUsers = await prisma.user.count()
  } catch {}

  try {
    result.appointments = await prisma.appointment.count()
    const agg = await prisma.appointment.aggregate({ _sum: { priceEGP: true } })
    result.revenue = agg._sum.priceEGP ?? 0
  } catch {}

  try {
    const providers = await prisma.user.findMany({
      where: { role: { in: ["doctor", "clinic", "hospital", "pharmacy", "lab", "radiology"] } },
      select: { fullName: true, _count: { select: { provided: true } } },
      orderBy: { provided: { _count: "desc" } },
      take: 6,
    })
    result.topProviders = providers.map((p) => ({
      name: p.fullName,
      count: p._count.provided,
    }))
  } catch {}

  try {
    const client = await clerkClient()
    const list = await client.users.getUserList({ limit: 100 })
    result.pending = list.data.filter((u) => {
      const m = u.publicMetadata as { role?: string; status?: string }
      return m.role && m.status === "pending"
    }).length
  } catch {}

  return result
}

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

export default async function AdminDashboard() {
  const s = await getStats()
  const roleCount = (r: string) => s.counts[r] ?? 0

  const bigCards = [
    { label: "الإيرادات", value: s.revenue, cls: "bg-gradient-to-br from-brand-800 to-brand-600 text-white" },
    { label: "المصروفات", value: 0, cls: "bg-gradient-to-br from-orange-400 to-orange-300 text-white" },
    { label: "صافي الربح", value: s.revenue, cls: "bg-gradient-to-br from-brand-100 to-brand-50 text-brand-800" },
  ]

  const smallCards = [
    { label: "المستخدمين", value: s.totalUsers },
    { label: "الأطباء", value: roleCount("doctor") },
    { label: "الصيدليات", value: roleCount("pharmacy") },
    { label: "العيادات", value: roleCount("clinic") },
    { label: "المستشفيات", value: roleCount("hospital") },
    { label: "مراكز الأشعة", value: roleCount("radiology") },
    { label: "المعامل", value: roleCount("lab") },
    { label: "المندوبين", value: roleCount("medical_rep") },
    { label: "شركات الأدوية", value: roleCount("pharma_company") },
    { label: "الحجوزات", value: s.appointments },
    { label: "الطلبات", value: s.pending },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">لوحة التحكم</h1>

      {/* Big KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {bigCards.map((c) => (
          <div key={c.label} className={"rounded-2xl p-5 shadow-sm " + c.cls}>
            <div className="flex items-center justify-between text-sm opacity-90">
              {c.label}
              <Info className="h-4 w-4 opacity-70" />
            </div>
            <div className="mt-3 font-display text-3xl font-extrabold">
              {fmt(c.value)} <span className="text-base font-semibold">ج.م</span>
            </div>
          </div>
        ))}
      </div>

      {/* Small stat cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {smallCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="mt-1 font-display text-2xl font-extrabold text-brand-700">
              {fmt(c.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Revenues chart */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-display font-bold">الإيرادات</div>
          <div className="text-sm text-slate-500">2025</div>
        </div>
        <LineChart data={sampleRevenue} color="#1fb2a3" />
        <MonthAxis />
      </div>

      {/* Expenses + Net profit */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold">المصروفات</div>
            <div className="text-sm text-slate-500">2025</div>
          </div>
          <BarChart data={sampleExpenses} />
          <MonthAxis />
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold">صافي الربح</div>
            <div className="text-sm text-slate-500">2025</div>
          </div>
          <LineChart data={sampleProfit} color="#0f9186" />
          <MonthAxis />
        </div>
      </div>

      {/* Top providers */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-3 font-display font-bold">أفضل مقدمي الخدمة</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-slate-400">
              <th className="pb-2 text-right font-medium">الاسم</th>
              <th className="pb-2 text-left font-medium">الحجوزات</th>
            </tr>
          </thead>
          <tbody>
            {s.topProviders.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-slate-400">
                  لا يوجد مقدمو خدمة بعد
                </td>
              </tr>
            )}
            {s.topProviders.map((p, i) => (
              <tr key={i} className="border-b border-black/5 last:border-0">
                <td className="py-2 text-right text-slate-700">{p.name}</td>
                <td className="py-2 text-left text-slate-500">{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - (v / max) * 88 - 6
      return x + "," + y
    })
    .join(" ")
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-40 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="mt-4 flex h-40 items-end gap-2">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-full rounded-t bg-orange-400"
          style={{ height: (v / max) * 100 + "%" }}
        />
      ))}
    </div>
  )
}

function MonthAxis() {
  return (
    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
      {MONTHS.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  )
}
