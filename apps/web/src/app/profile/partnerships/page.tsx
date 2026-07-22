import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { PROVIDER_ROLES } from "../../../lib/providers"
import {
  addPartnership,
  deletePartnership,
} from "../../../lib/partnershipActions"
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Handshake,
  Trash2,
  Phone,
  Percent,
  Info,
} from "lucide-react"

export const dynamic = "force-dynamic"

// أنواع الشركاء (مقدمو خدمة بس — الدكاترة الزمايل مكانهم في الدعوات)
const PARTNER_TYPES: { value: string; label: string; basis: string }[] = [
  { value: "pharmacy", label: "صيدلية", basis: "نسبة من كل روشتة" },
  {
    value: "lab",
    label: "معمل تحاليل",
    basis: "نسبة من كل طلب تحاليل",
  },
  { value: "radiology", label: "مركز أشعة", basis: "نسبة من كل طلب أشعة" },
  {
    value: "hospital",
    label: "مستشفى / مركز طبيات",
    basis: "نسبة من كل تعامل (عمليات ونحوها)",
  },
  {
    value: "pharma_company",
    label: "شركة أدوية",
    basis: "متابعة الروشتات والمبيعات، واتفاق خاص",
  },
]

function typeInfo(value: string) {
  return PARTNER_TYPES.find((t) => t.value === value)
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export default async function PartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>
}) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const meta = u.publicMetadata as { role?: Role }
  if (!meta.role) redirect("/onboarding")
  if (!PROVIDER_ROLES.includes(meta.role)) redirect("/profile")

  const sp = await searchParams
  const saved = sp?.saved === "1"
  const deleted = sp?.deleted === "1"
  const missing = sp?.error === "missing"

  let partnerships: Array<{
    id: string
    partnerName: string
    partnerType: string
    partnerPhone: string | null
    discountPct: number
    patientPct: number
    doctorPct: number
    note: string | null
    createdAt: Date
  }> = []
  try {
    partnerships = await prisma.partnership.findMany({
      where: { ownerId: u.id },
      orderBy: { createdAt: "desc" },
    })
  } catch {}

  const fieldCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
  const labelCls = "mb-1 block text-sm font-medium text-slate-700"

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للبروفايل
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
          <Handshake className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">الشراكات</h1>
          <p className="text-sm text-slate-500">
            الصيدليات والمعامل والمستشفيات وشركات الأدوية اللي بتتعامل معاهم
            ونِسبك من تعاملات مرضاك.
          </p>
        </div>
      </div>

      {/* تنويه: الدكاترة الزمايل مكانهم في الدعوات */}
      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>
          الدكاترة الزمايل مش شركاء بعمولة — دول بتدعوهم وترشحهم لمرضاك من صفحة
          «الدعوات».
        </span>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تمت إضافة الشريك بنجاح
        </div>
      )}
      {deleted && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <CheckCircle2 className="h-4 w-4" />
          تم حذف الشريك
        </div>
      )}
      {missing && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          لازم تدخل اسم الشريك ونوعه على الأقل
        </div>
      )}

      {/* فورم إضافة شريك */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          إضافة شريك جديد
        </h2>
        <form action={addPartnership} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="partnerName" className={labelCls}>
                اسم الشريك
              </label>
              <input
                id="partnerName"
                name="partnerName"
                required
                placeholder="مثال: صيدلية الشفاء / معمل البرج"
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="partnerType" className={labelCls}>
                نوع الشريك
              </label>
              <select
                id="partnerType"
                name="partnerType"
                required
                defaultValue=""
                className={fieldCls}
              >
                <option value="" disabled>
                  اختار النوع
                </option>
                {PARTNER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="partnerPhone" className={labelCls}>
              رقم التواصل / واتساب (اختياري)
            </label>
            <input
              id="partnerPhone"
              name="partnerPhone"
              dir="ltr"
              inputMode="tel"
              placeholder="01xxxxxxxxx"
              className={fieldCls + " text-right"}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-1 text-sm font-medium text-slate-700">
              <Percent className="h-4 w-4 text-[#1fb2a3]" />
              النسبة وتوزيعها
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="discountPct" className={labelCls}>
                  النسبة المتفق عليها %
                </label>
                <input
                  id="discountPct"
                  name="discountPct"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={0}
                  className={fieldCls}
                />
              </div>
              <div>
                <label htmlFor="patientPct" className={labelCls}>
                  منها للمريض %
                </label>
                <input
                  id="patientPct"
                  name="patientPct"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={0}
                  className={fieldCls}
                />
              </div>
              <div>
                <label htmlFor="doctorPct" className={labelCls}>
                  منها ليك %
                </label>
                <input
                  id="doctorPct"
                  name="doctorPct"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={0}
                  className={fieldCls}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              مثال: نسبة متفق عليها 20% → 12% خصم للمريض و 8% ليك.
            </p>
          </div>

          <div>
            <label htmlFor="note" className={labelCls}>
              ملاحظات (اختياري)
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="أي تفاصيل إضافية عن الاتفاق"
              className={fieldCls + " resize-none"}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            إضافة الشريك
          </button>
        </form>
      </div>

      {/* قائمة الشركاء */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          الشركاء الحاليون ({partnerships.length})
        </h2>

        {partnerships.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <Handshake className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              لسّة مفيش شركاء
            </p>
            <p className="mt-1 text-xs text-slate-400">
              أضف أول شريك من الفورم فوق عشان يظهر هنا.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {partnerships.map((p) => {
              const info = typeInfo(p.partnerType)
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {p.partnerName}
                        </span>
                        <span className="rounded-full bg-[#1fb2a3]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f766e]">
                          {info?.label ?? p.partnerType}
                        </span>
                      </div>
                      {info?.basis ? (
                        <div className="mt-1 text-xs text-slate-400">
                          {info.basis}
                        </div>
                      ) : null}
                      <div className="mt-1 text-xs text-slate-400">
                        منذ {formatDate(new Date(p.createdAt))}
                      </div>
                      {p.partnerPhone ? (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3.5 w-3.5" />
                          <span dir="ltr">{p.partnerPhone}</span>
                        </div>
                      ) : null}
                      {p.note ? (
                        <p className="mt-2 text-sm text-slate-600">{p.note}</p>
                      ) : null}
                    </div>

                    <form action={deletePartnership}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      النسبة المتفق عليها: {p.discountPct}%
                    </span>
                    <span className="rounded-lg bg-[#1fb2a3]/10 px-2.5 py-1 text-xs text-[#0f766e]">
                      للمريض: {p.patientPct}%
                    </span>
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                      ليك: {p.doctorPct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
