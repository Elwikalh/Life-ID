import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"
import { prisma } from "@life-id/db"
import { getProviderData, getPatientData } from "../../lib/dashboard"
import { setAppointmentStatus } from "../../lib/appointmentActions"
import {
  CalendarDays,
  Clock,
  Users,
  Wallet,
  Stethoscope,
  QrCode,
  ArrowLeft,
} from "lucide-react"

export const dynamic = "force-dynamic"

const PROVIDER_ROLES: Role[] = [
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "pharma_company",
  "medical_rep",
  "emergency",
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

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-[11px] font-medium " +
        (STATUS_CLS[status] ?? "bg-slate-100 text-slate-500")
      }
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function ActionForm({
  id,
  status,
  label,
  className,
}: {
  id: string
  status: string
  label: string
  className: string
}) {
  return (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  )
}

const BTN_PRIMARY =
  "rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
const BTN_GHOST =
  "rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-slate-500 hover:border-danger/40 hover:text-danger"
const BTN_RX =
  "rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"

export default async function Dashboard() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status !== "approved") redirect("/pending")
  if (meta.role === "super_admin") redirect("/admin")

  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || email || "مستخدم"

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, role: meta.role, fullName, email },
    })
  } catch {}

  const isProvider = PROVIDER_ROLES.includes(meta.role)

  if (isProvider) {
    const d = await getProviderData(user.id)
    const cards = [
      { label: "إجمالي الحجوزات", value: fmt(d.totalAppointments), icon: CalendarDays },
      { label: "الحجوزات القادمة", value: fmt(d.upcoming), icon: Clock },
      { label: "المرضى", value: fmt(d.patientsCount), icon: Users },
      { label: "الإيرادات", value: fmt(d.revenue) + " ج.م", icon: Wallet },
    ]
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-extrabold">أهلًا، {fullName}</h1>
        <p className="text-sm text-slate-500">لوحة تحكم {ROLE_LABELS[meta.role]}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon className="h-4 w-4 text-brand-500" />
                  {c.label}
                </div>
                <div className="mt-2 font-display text-2xl font-extrabold text-brand-700">{c.value}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 font-display font-bold">أحدث الحجوزات</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-slate-400">
                  <th className="pb-2 text-right font-medium">المريض</th>
                  <th className="pb-2 text-left font-medium">القيمة</th>
                  <th className="pb-2 text-center font-medium">الحالة</th>
                  <th className="pb-2 text-left font-medium">الموعد</th>
                  <th className="pb-2 text-center font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">لا توجد حجوزات بعد</td>
                  </tr>
                )}
                {d.recent.map((a) => (
                  <tr key={a.id} className="border-b border-black/5 last:border-0">
                    <td className="py-2.5 text-right text-slate-700">{a.patientName}</td>
                    <td className="py-2.5 text-left text-slate-500">{fmt(a.priceEGP)}</td>
                    <td className="py-2.5 text-center"><StatusBadge status={a.status} /></td>
                    <td className="py-2.5 text-left text-slate-400">{fmtDate(a.scheduledAt)}</td>
                    <td className="py-2.5">
                      <div className="flex justify-center gap-1.5">
                        {a.status === "pending" && (
                          <>
                            <ActionForm id={a.id} status="confirmed" label="تأكيد" className={BTN_PRIMARY} />
                            <ActionForm id={a.id} status="cancelled" label="رفض" className={BTN_GHOST} />
                          </>
                        )}
                        {a.status === "confirmed" && (
                          <>
                            <ActionForm id={a.id} status="completed" label="إتمام" className={BTN_PRIMARY} />
                            <ActionForm id={a.id} status="cancelled" label="إلغاء" className={BTN_GHOST} />
                            <Link href={"/rx/" + a.id} className={BTN_RX}>روشتة</Link>
                          </>
                        )}
                        {a.status === "completed" && (
                          <Link href={"/rx/" + a.id} className={BTN_RX}>روشتة</Link>
                        )}
                        {a.status === "cancelled" && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    )
  }

  // لوحة المريض
  const d = await getPatientData(user.id)
  const cards = [
    { label: "حجوزاتي", value: fmt(d.total), icon: CalendarDays },
    { label: "القادمة", value: fmt(d.upcoming), icon: Clock },
    { label: "مقدمو الخدمة", value: fmt(d.providersCount), icon: Stethoscope },
  ]
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">أهلًا، {fullName}</h1>
      <p className="text-sm text-slate-500">لوحة تحكم {ROLE_LABELS[meta.role]}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Icon className="h-4 w-4 text-brand-500" />
                {c.label}
              </div>
              <div className="mt-2 font-display text-2xl font-extrabold text-brand-700">{c.value}</div>
            </div>
          )
        })}
      </div>

      <Link
        href="/id"
        className="mt-6 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50/60 p-5 transition hover:bg-brand-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold text-slate-800">بطاقتي الطبية</div>
            <div className="text-sm text-slate-500">اعرض هويتك الطبية وكود الطوارئ</div>
          </div>
        </div>
        <ArrowLeft className="h-5 w-5 text-brand-500" />
      </Link>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-4 font-display font-bold">حجوزاتي الأخيرة</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-slate-400">
                <th className="pb-2 text-right font-medium">مقدم الخدمة</th>
                <th className="pb-2 text-center font-medium">الحالة</th>
                <th className="pb-2 text-left font-medium">الموعد</th>
              </tr>
            </thead>
            <tbody>
              {d.recent.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">لا توجد حجوزات بعد</td>
                </tr>
              )}
              {d.recent.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="py-2.5 text-right text-slate-700">{a.providerName}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={a.status} /></td>
                  <td className="py-2.5 text-left text-slate-400">{fmtDate(a.scheduledAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
