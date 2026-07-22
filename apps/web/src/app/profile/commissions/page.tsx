import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { PROVIDER_ROLES } from "../../../lib/providers"
import { getCommissionOverview, computeSplit } from "../../../lib/commissions"
import {
  ArrowRight,
  Calculator,
  Percent,
  Wallet,
  HandCoins,
  Users,
  AlertTriangle,
  Handshake,
} from "lucide-react"

export const dynamic = "force-dynamic"

const TYPE_LABELS: Record<string, string> = {
  pharmacy: "صيدلية",
  lab: "معمل تحاليل",
  radiology: "مركز أشعة",
  hospital: "مستشفى / مركز طبي",
  pharma_company: "شركة أدوية",
}

function egp(n: number) {
  return n.toLocaleString("en-US") + " ج.م"
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string }>
}) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const meta = u.publicMetadata as { role?: Role }
  if (!meta.role) redirect("/onboarding")
  if (!PROVIDER_ROLES.includes(meta.role)) redirect("/profile")

  const sp = await searchParams
  const parsed = parseInt(sp?.amount ?? "500", 10)
  const amount =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(1000000, parsed) : 500

  const overview = await getCommissionOverview(u.id)

  const cardCls = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
  const statCls =
    "rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link
          href="/profile/partnerships"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للشراكات
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
          <Calculator className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">العمولات والأرباح</h1>
          <p className="text-sm text-slate-500">
            احسب نصيب المريض من الخصم وأرباحك من كل شراكة على أي مبلغ فاتورة.
          </p>
        </div>
      </div>

      {overview.count === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <Handshake className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">لسّه مفيش شراكات</p>
          <p className="mt-1 text-xs text-slate-400">
            أضف شراكة واحدة على الأقل عشان تقدر تحسب العمولات والأرباح.
          </p>
          <Link
            href="/profile/partnerships"
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-[#1fb2a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            <Handshake className="h-4 w-4" />
            إضافة شراكة
          </Link>
        </div>
      ) : (
        <>
          {/* بطاقات ملخص */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={statCls}>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="h-3.5 w-3.5" />
                الشراكات
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {overview.count}
              </div>
            </div>
            <div className={statCls}>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Percent className="h-3.5 w-3.5" />
                متوسط الخصم
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {overview.avgDiscount}%
              </div>
            </div>
            <div className={statCls}>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Wallet className="h-3.5 w-3.5" />
                متوسط المريض
              </div>
              <div className="mt-1 text-lg font-bold text-[#0f766e]">
                {overview.avgPatient}%
              </div>
            </div>
            <div className={statCls}>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <HandCoins className="h-3.5 w-3.5" />
                متوسط ربحك
              </div>
              <div className="mt-1 text-lg font-bold text-amber-600">
                {overview.avgDoctor}%
              </div>
            </div>
          </div>

          {overview.imbalanced > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                فيه {overview.imbalanced} شراكة تقسيمها غير متوازن (نصيب المريض +
                ربحك لا يساوي نسبة الخصم). راجعها من صفحة الشراكات.
              </span>
            </div>
          )}

          {/* حاسبة المبلغ */}
          <form
            action="/profile/commissions"
            method="get"
            className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <label
              htmlFor="amount"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              مبلغ الفاتورة (ج.م)
            </label>
            <div className="flex gap-2">
              <input
                id="amount"
                name="amount"
                type="number"
                min={1}
                defaultValue={amount}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#1fb2a3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#178f83]"
              >
                احسب
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              النتيجة بتتحسب على مبلغ {egp(amount)} لكل شراكة تحت.
            </p>
          </form>

          {/* تفصيل كل شراكة */}
          <div className="mt-5 space-y-3">
            {overview.partnerships.map((p) => {
              const s = computeSplit(
                amount,
                p.discountPct,
                p.patientPct,
                p.doctorPct,
              )
              return (
                <div key={p.id} className={cardCls}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {p.partnerName}
                      </span>
                      <span className="rounded-full bg-[#1fb2a3]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f766e]">
                        {TYPE_LABELS[p.partnerType] ?? p.partnerType}
                      </span>
                    </div>
                    {!s.balanced && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {s.overAllocated ? "تقسيم زائد" : "غير متوازن"}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-400">خصم الجهة</div>
                      <div className="mt-0.5 text-sm font-bold text-slate-700">
                        {egp(s.discountAmount)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.discountPct}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#1fb2a3]/10 px-3 py-2">
                      <div className="text-xs text-slate-400">يوفّر للمريض</div>
                      <div className="mt-0.5 text-sm font-bold text-[#0f766e]">
                        {egp(s.patientSaves)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.patientPct}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-3 py-2">
                      <div className="text-xs text-slate-400">ربحك</div>
                      <div className="mt-0.5 text-sm font-bold text-amber-600">
                        {egp(s.doctorEarns)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.doctorPct}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-400">يدفع المريض</div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">
                        {egp(s.patientPays)}
                      </div>
                      <div className="text-xs text-slate-400">بعد خصمه</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
