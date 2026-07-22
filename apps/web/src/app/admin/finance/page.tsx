import { getFinanceSummary } from "../../../lib/finance"
import { Wallet, TrendingUp, Percent, Receipt } from "lucide-react"

export const dynamic = "force-dynamic"

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
]

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
}

const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  completed: "bg-brand-100 text-brand-700",
  cancelled: "bg-slate-100 text-slate-500",
}

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

export default async function FinancePage() {
  const f = await getFinanceSummary()
  const year = new Date().getFullYear()

  const bigCards = [
    { label: "إجمالي الإيرادات", value: f.gross, icon: Wallet, cls: "bg-gradient-to-br from-brand-800 to-brand-600 text-white" },
    { label: "صافي الإيرادات", value: f.net, icon: TrendingUp, cls: "bg-gradient-to-br from-brand-100 to-brand-50 text-brand-800" },
    { label: "عمولة المنصة (10%)", value: f.commission, icon: Percent, cls: "bg-gradient-to-br from-orange-400 to-orange-300 text-white" },
  ]

  const smallCards = [
    { label: "عدد المعاملات", value: f.txnCount, unit: "" },
    { label: "إجمالي الخصومات", value: f.discounts, unit: "ج.م" },
    { label: "مستحقات مقدمي الخدمة", value: f.payout, unit: "ج.م" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">المالية</h1>
        <span className="text-sm text-slate-400">{year}</span>
      </div>

      {/* البطاقات الكبيرة */}
      <div className="grid gap-4 sm:grid-cols-3">
        {bigCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className={"rounded-2xl p-5 shadow-sm " + c.cls}>
              <div className="flex items-center justify-between text-sm opacity-90">
                {c.label}
                <Icon className="h-4 w-4 opacity-70" />
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold">
                {fmt(c.value)} <span className="text-base font-semibold">ج.م</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* بطاقات صغيرة */}
      <div className="grid gap-4 sm:grid-cols-3">
        {smallCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="mt-1 font-display text-2xl font-extrabold text-brand-700">
              {fmt(c.value)}
              {c.unit ? <span className="mr-1 text-sm font-semibold text-slate-400">{c.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>

      {/* رسم صافي الإيراد الشهري */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-display font-bold">صافي الإيرادات الشهري</div>
          <div className="text-sm text-slate-500">{year}</div>
        </div>
        <BarChart data={f.monthlyNet} />
        <div className="mt-2 flex justify-between text-[10px] text-slate-400">
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      {/* جدول المعاملات */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-display font-bold">
          <Receipt className="h-4 w-4 text-brand-500" />
          أحدث المعاملات
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-slate-400">
                <th className="pb-2 text-right font-medium">المريض</th>
                <th className="pb-2 text-right font-medium">مقدم الخدمة</th>
                <th className="pb-2 text-left font-medium">القيمة</th>
                <th className="pb-2 text-left font-medium">الخصم</th>
                <th className="pb-2 text-left font-medium">الصافي</th>
                <th className="pb-2 text-center font-medium">الحالة</th>
                <th className="pb-2 text-left font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {f.transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    لا توجد معاملات بعد
                  </td>
                </tr>
              )}
              {f.transactions.map((t) => (
                <tr key={t.id} className="border-b border-black/5 last:border-0">
                  <td className="py-2.5 text-right text-slate-700">{t.patientName}</td>
                  <td className="py-2.5 text-right text-slate-700">{t.providerName}</td>
                  <td className="py-2.5 text-left text-slate-500">{fmt(t.gross)}</td>
                  <td className="py-2.5 text-left text-slate-500">{t.discountPct}%</td>
                  <td className="py-2.5 text-left font-semibold text-brand-700">{fmt(t.net)}</td>
                  <td className="py-2.5 text-center">
                    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (STATUS_CLS[t.status] ?? "bg-slate-100 text-slate-500")}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-left text-slate-400">
                    {t.date.toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="mt-4 flex h-40 items-end gap-2">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-full rounded-t bg-brand-500"
          style={{ height: (v / max) * 100 + "%" }}
          title={fmt(v)}
        />
      ))}
    </div>
  )
}
