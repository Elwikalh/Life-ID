import { getManagementData } from "../../../lib/management"
import { Percent, Coins, Wrench, Database } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ManagementPage() {
  const data = await getManagementData()
  const devTools = process.env.DEV_TOOLS === "1"
  const maxCount = Math.max(...data.roleDistribution.map((r) => r.count), 1)

  const settings = [
    { label: "عمولة المنصة", value: "10%", icon: Percent },
    { label: "العملة", value: "ج.م (EGP)", icon: Coins },
    { label: "وضع التطوير", value: devTools ? "مُفعّل" : "غير مُفعّل", icon: Wrench },
    { label: "قاعدة البيانات", value: data.dbConnected ? "متصلة" : "غير متصلة", icon: Database },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">الإدارة</h1>

      {/* إعدادات المنصة */}
      <div>
        <div className="mb-3 font-display font-bold text-slate-700">إعدادات المنصة</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {settings.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon className="h-4 w-4 text-brand-500" />
                  {s.label}
                </div>
                <div className="mt-2 font-display text-lg font-extrabold text-slate-800">{s.value}</div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">تعديل هذه الإعدادات مباشرةً من اللوحة هييجي قريبًا.</p>
      </div>

      {/* توزيع المستخدمين */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-4 font-display font-bold">توزيع المستخدمين حسب الدور</div>
        <div className="space-y-3">
          {data.roleDistribution.map((r) => (
            <div key={r.role} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-sm text-slate-600">{r.label}</div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: (r.count / maxCount) * 100 + "%" }}
                />
              </div>
              <div className="w-10 shrink-0 text-left text-sm font-semibold text-slate-700">{r.count}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-black/5 pt-3 text-sm text-slate-500">
          إجمالي المستخدمين: <span className="font-bold text-brand-700">{data.totalUsers}</span>
        </div>
      </div>
    </div>
  )
}
