import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { PROVIDER_ROLES } from "../../../lib/providers"
import {
  sendInvitation,
  markJoined,
  deleteInvitation,
} from "../../../lib/invitationActions"
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Trash2,
  UserPlus,
  Clock,
  BadgeCheck,
  Percent,
} from "lucide-react"

export const dynamic = "force-dynamic"

// أنواع المدعوين: زميل طبيب (ترشيح) + مقدمي الخدمة (دعوة + نسبة)
const INVITEE_TYPES: { value: string; label: string; provider: boolean }[] = [
  { value: "doctor", label: "زميل طبيب (ترشيح)", provider: false },
  { value: "pharmacy", label: "صيدلية", provider: true },
  { value: "lab", label: "معمل تحاليل", provider: true },
  { value: "radiology", label: "مركز أشعة", provider: true },
  { value: "hospital", label: "مستشفى / مركز طبي", provider: true },
  { value: "pharma_company", label: "شركة أدوية", provider: true },
]

function typeLabel(value: string) {
  return INVITEE_TYPES.find((t) => t.value === value)?.label ?? value
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string
    joined?: string
    deleted?: string
    error?: string
  }>
}) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const meta = u.publicMetadata as { role?: Role }
  if (!meta.role) redirect("/onboarding")
  if (!PROVIDER_ROLES.includes(meta.role)) redirect("/profile")

  const sp = await searchParams
  const sent = sp?.sent === "1"
  const joined = sp?.joined === "1"
  const deleted = sp?.deleted === "1"
  const missing = sp?.error === "missing"

  let invitations: Array<{
    id: string
    inviteeName: string
    inviteeType: string
    contact: string | null
    requestedPct: number | null
    message: string | null
    status: string
    createdAt: Date
  }> = []
  try {
    invitations = await prisma.invitation.findMany({
      where: { inviterId: u.id },
      orderBy: { createdAt: "desc" },
    })
  } catch {}

  const pendingCount = invitations.filter((i) => i.status !== "joined").length
  const joinedCount = invitations.filter((i) => i.status === "joined").length

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
          <Mail className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">الدعوات</h1>
          <p className="text-sm text-slate-500">
            ادعي زمايلك الأطباء ومقدمي الخدمة للانضمام.
          </p>
        </div>
      </div>

      {/* ملخص سريع */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-4 w-4" />
            قيد الانتظار
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {pendingCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BadgeCheck className="h-4 w-4" />
            مُنضم
          </div>
          <div className="mt-1 text-2xl font-bold text-[#0f766e]">
            {joinedCount}
          </div>
        </div>
      </div>

      {sent && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم إرسال الدعوة بنجاح
        </div>
      )}
      {joined && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <BadgeCheck className="h-4 w-4" />
          تم تحديث حالة الدعوة إلى «مُنضم»
        </div>
      )}
      {deleted && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <CheckCircle2 className="h-4 w-4" />
          تم حذف الدعوة
        </div>
      )}
      {missing && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          لازم تدخل اسم المدعو ونوعه على الأقل
        </div>
      )}

      {/* فورم إرسال دعوة */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <UserPlus className="h-5 w-5 text-[#1fb2a3]" />
          إرسال دعوة جديدة
        </h2>
        <form action={sendInvitation} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="inviteeType" className={labelCls}>
                نوع المدعو
              </label>
              <select
                id="inviteeType"
                name="inviteeType"
                required
                defaultValue=""
                className={fieldCls}
              >
                <option value="" disabled>
                  اختار النوع
                </option>
                {INVITEE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inviteeName" className={labelCls}>
                اسم المدعو
              </label>
              <input
                id="inviteeName"
                name="inviteeName"
                required
                placeholder="مثال: د. محمد علي / صيدلية الشفاء"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact" className={labelCls}>
              البريد أو رقم التواصل (اختياري)
            </label>
            <input
              id="contact"
              name="contact"
              dir="ltr"
              placeholder="email@example.com أو 01xxxxxxxxx"
              className={fieldCls + " text-right"}
            />
          </div>

          <div>
            <label htmlFor="requestedPct" className={labelCls}>
              النسبة المطلوبة % (لمقدمي الخدمة فقط)
            </label>
            <div className="relative">
              <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="requestedPct"
                name="requestedPct"
                type="number"
                min={0}
                max={100}
                placeholder="مثال: 20"
                className={fieldCls + " pr-9"}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              سيبها فاضية لو الدعوة لزميل طبيب (ترشيح بدون نسبة).
            </p>
          </div>

          <div>
            <label htmlFor="message" className={labelCls}>
              رسالة الدعوة (اختياري)
            </label>
            <textarea
              id="message"
              name="message"
              rows={2}
              placeholder="أهلاً، أدعوك للانضمام لـ Life ID..."
              className={fieldCls + " resize-none"}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            إرسال الدعوة
          </button>
        </form>
      </div>

      {/* قائمة الدعوات */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          الدعوات ({invitations.length})
        </h2>

        {invitations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <Mail className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">لسّة مفيش دعوات</p>
            <p className="mt-1 text-xs text-slate-400">
              ابعت أول دعوة من الفورم فوق عشان تظهر هنا.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => {
              const isJoined = inv.status === "joined"
              return (
                <div
                  key={inv.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {inv.inviteeName}
                        </span>
                        <span className="rounded-full bg-[#1fb2a3]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f766e]">
                          {typeLabel(inv.inviteeType)}
                        </span>
                        {isJoined ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#1fb2a3]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f766e]">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            مُنضم
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            قيد الانتظار
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        منذ {formatDate(new Date(inv.createdAt))}
                      </div>
                      {inv.contact ? (
                        <div className="mt-1 text-xs text-slate-500" dir="ltr">
                          {inv.contact}
                        </div>
                      ) : null}
                      {inv.requestedPct != null ? (
                        <div className="mt-2 inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          النسبة المطلوبة: {inv.requestedPct}%
                        </div>
                      ) : null}
                      {inv.message ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {inv.message}
                        </p>
                      ) : null}
                    </div>

                    <form action={deleteInvitation}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button
                        type="submit"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                  {!isJoined ? (
                    <form action={markJoined} className="mt-3">
                      <input type="hidden" name="id" value={inv.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-3 py-1.5 text-xs font-medium text-[#0f766e] transition hover:bg-[#1fb2a3]/20"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        تعليم كمُنضم
                      </button>
                    </form>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
