import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"
import { prisma } from "@life-id/db"
import {
  getProviderData,
  getPatientData,
  getPharmaData,
  getRepSelfData,
} from "../../lib/dashboard"
import { setAppointmentStatus } from "../../lib/appointmentActions"
import {
  PageIntro,
  KpiCard,
  SectionCard,
  EmptyState,
  QuickAction,
  Badge,
} from "../../components/dash"
import {
  CalendarDays,
  Clock,
  Users,
  Wallet,
  Stethoscope,
  QrCode,
  Pill,
  Package,
  Handshake,
  MapPin,
  Plus,
  Mail,
  Building2,
  UserRound,
  ClipboardList,
} from "lucide-react"

export const dynamic = "force-dynamic"

type DashProps = { userId: string; name: string; roleLabel: string }

const APPT_ROLES: Role[] = [
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "emergency",
]

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
}

const STATUS_TONE: Record<string, "amber" | "sky" | "brand" | "neutral"> = {
  pending: "amber",
  confirmed: "sky",
  completed: "brand",
  cancelled: "neutral",
}

const BTN_PRIMARY =
  "rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
const BTN_GHOST =
  "rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-slate-500 hover:border-danger/40 hover:text-danger"
const BTN_RX =
  "rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"

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

function ApptAction({
  id,
  status,
  label,
  variant,
}: {
  id: string
  status: string
  label: string
  variant: "primary" | "ghost"
}) {
  return (
    <form action={setAppointmentStatus} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={variant === "primary" ? BTN_PRIMARY : BTN_GHOST}
      >
        {label}
      </button>
    </form>
  )
}

export default async function Dashboard() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status !== "approved") redirect("/pending")
  if (meta.role === "super_admin") redirect("/admin")

  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email ||
    "مستخدم"

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, role: meta.role, fullName, email },
    })
  } catch {}

  const roleLabel = ROLE_LABELS[meta.role]
  const props: DashProps = { userId: user.id, name: fullName, roleLabel }

  if (meta.role === "pharma_company") return <PharmaDashboard {...props} />
  if (meta.role === "medical_rep") return <RepDashboard {...props} />
  if (APPT_ROLES.includes(meta.role)) return <ProviderDashboard {...props} />
  return <PatientDashboard {...props} />
}

async function PharmaDashboard({ userId, name, roleLabel }: DashProps) {
  const d = await getPharmaData(userId)
  return (
    <div className="space-y-6">
      <PageIntro title={"أهلًا، " + name} subtitle={"لوحة تحكم " + roleLabel} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label="المنتجات"
          value={fmt(d.productsCount)}
          href="/profile/products"
        />
        <KpiCard
          icon={Users}
          label="المندوبين"
          value={fmt(d.repsCount)}
          href="/profile/reps"
        />
        <KpiCard
          icon={MapPin}
          label="زيارات المندوبين"
          value={fmt(d.visitsCount)}
        />
        <KpiCard
          icon={Handshake}
          label="الشراكات"
          value={fmt(d.partnershipsCount)}
          href="/profile/partnerships"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="أحدث المنتجات"
          actionHref="/profile/products"
          actionLabel="إدارة المنتجات"
        >
          {d.recentProducts.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="لسه مضفتش منتجات"
              hint="أضف أول منتج لشركتك يظهر هنا"
              ctaHref="/profile/products"
              ctaLabel="أضف منتج"
            />
          ) : (
            <ul className="divide-y divide-black/5">
              {d.recentProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-700">
                      {p.name}
                    </div>
                    {p.category && (
                      <div className="text-xs text-slate-400">{p.category}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-sm text-slate-500">
                    {p.price != null ? fmt(p.price) + " ج.م" : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="المندوبين"
          actionHref="/profile/reps"
          actionLabel="إدارة المندوبين"
        >
          {d.topReps.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا يوجد مندوبين بعد"
              hint="ضيف مندوبينك وتابع زياراتهم"
              ctaHref="/profile/reps"
              ctaLabel="أضف مندوب"
            />
          ) : (
            <ul className="divide-y divide-black/5">
              {d.topReps.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-700">
                      {r.name}
                    </div>
                    {r.region && (
                      <div className="text-xs text-slate-400">{r.region}</div>
                    )}
                  </div>
                  <Badge tone="brand">{fmt(r.visits) + " زيارة"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="أحدث زيارات المندوبين">
        {d.recentVisits.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="لا توجد زيارات مسجّلة"
            hint="هتظهر هنا أول ما المندوبين يسجّلوا زياراتهم"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">الطبيب</th>
                  <th className="pb-2 font-medium">المنطقة</th>
                  <th className="pb-2 font-medium">النتيجة</th>
                  <th className="pb-2 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {d.recentVisits.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 font-medium text-slate-700">
                      {v.doctorName}
                    </td>
                    <td className="py-2.5 text-slate-500">{v.region ?? "—"}</td>
                    <td className="py-2.5 text-slate-500">
                      {v.outcome ?? "—"}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {fmtDate(v.visitDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div>
        <h2 className="mb-3 font-display font-bold text-slate-800">
          إجراءات سريعة
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/profile/products" icon={Plus} label="أضف منتج" />
          <QuickAction
            href="/profile/reps"
            icon={UserRound}
            label="أضف مندوب"
          />
          <QuickAction
            href="/profile/invitations"
            icon={Mail}
            label="الدعوات"
          />
          <QuickAction
            href="/profile/partnerships"
            icon={Handshake}
            label="الشراكات"
          />
        </div>
      </div>
    </div>
  )
}

async function RepDashboard({ userId, name, roleLabel }: DashProps) {
  const d = await getRepSelfData(userId)
  return (
    <div className="space-y-6">
      <PageIntro title={"أهلًا، " + name} subtitle={"لوحة تحكم " + roleLabel} />
      {!d.linked ? (
        <SectionCard title="اربط حسابك بشركتك">
          <EmptyState
            icon={Building2}
            title="حسابك لسه مش مربوط بشركة"
            hint="اطلب كود الربط من شركة الأدوية وادخله من بوابة المندوب"
            ctaHref="/rep"
            ctaLabel="بوابة المندوب"
          />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={Building2}
              label="الشركة"
              value={d.companyName ?? "—"}
            />
            <KpiCard icon={MapPin} label="المنطقة" value={d.region ?? "—"} />
            <KpiCard
              icon={ClipboardList}
              label="زياراتي"
              value={fmt(d.visitsCount)}
              href="/rep"
            />
          </div>
          <SectionCard
            title="أحدث زياراتي"
            actionHref="/rep"
            actionLabel="كل الزيارات"
          >
            {d.recentVisits.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="لسه مسجّلتش زيارات"
                hint="سجّل زياراتك من بوابة المندوب"
                ctaHref="/rep"
                ctaLabel="سجّل زيارة"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="pb-2 font-medium">الطبيب</th>
                      <th className="pb-2 font-medium">المنطقة</th>
                      <th className="pb-2 font-medium">النتيجة</th>
                      <th className="pb-2 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {d.recentVisits.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2.5 font-medium text-slate-700">
                          {v.doctorName}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {v.region ?? "—"}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {v.outcome ?? "—"}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {fmtDate(v.visitDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

async function ProviderDashboard({ userId, name, roleLabel }: DashProps) {
  const d = await getProviderData(userId)
  return (
    <div className="space-y-6">
      <PageIntro title={"أهلًا، " + name} subtitle={"لوحة تحكم " + roleLabel} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CalendarDays}
          label="إجمالي الحجوزات"
          value={fmt(d.totalAppointments)}
        />
        <KpiCard
          icon={Clock}
          label="الحجوزات القادمة"
          value={fmt(d.upcoming)}
        />
        <KpiCard icon={Users} label="المرضى" value={fmt(d.patientsCount)} />
        <KpiCard
          icon={Wallet}
          label="الإيرادات"
          value={fmt(d.revenue) + " ج.م"}
        />
      </div>

      <SectionCard title="أحدث الحجوزات">
        {d.recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="لا توجد حجوزات بعد"
            hint="هتظهر الحجوزات هنا أول ما يتم حجز مواعيد"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">المريض</th>
                  <th className="pb-2 font-medium">القيمة</th>
                  <th className="pb-2 font-medium">الحالة</th>
                  <th className="pb-2 font-medium">الموعد</th>
                  <th className="pb-2 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {d.recent.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-medium text-slate-700">
                      {a.patientName}
                    </td>
                    <td className="py-2.5 text-slate-500">{fmt(a.priceEGP)}</td>
                    <td className="py-2.5">
                      <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {fmtDate(a.scheduledAt)}
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {a.status === "pending" && (
                          <>
                            <ApptAction
                              id={a.id}
                              status="confirmed"
                              label="تأكيد"
                              variant="primary"
                            />
                            <ApptAction
                              id={a.id}
                              status="cancelled"
                              label="رفض"
                              variant="ghost"
                            />
                          </>
                        )}
                        {a.status === "confirmed" && (
                          <>
                            <ApptAction
                              id={a.id}
                              status="completed"
                              label="إنهاء"
                              variant="primary"
                            />
                            <Link href={"/rx/" + a.id} className={BTN_RX}>
                              روشتة
                            </Link>
                          </>
                        )}
                        {a.status === "completed" && (
                          <Link href={"/rx/" + a.id} className={BTN_RX}>
                            روشتة
                          </Link>
                        )}
                        {a.status === "cancelled" && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

async function PatientDashboard({ userId, name, roleLabel }: DashProps) {
  const d = await getPatientData(userId)
  return (
    <div className="space-y-6">
      <PageIntro title={"أهلًا، " + name} subtitle={"لوحة تحكم " + roleLabel} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={CalendarDays}
          label="حجوزاتي"
          value={fmt(d.total)}
          href="/appointments"
        />
        <KpiCard icon={Clock} label="القادمة" value={fmt(d.upcoming)} />
        <KpiCard
          icon={Stethoscope}
          label="مقدمو الخدمة"
          value={fmt(d.providersCount)}
          href="/search"
        />
      </div>

      <SectionCard
        title="بطاقتي الطبية"
        actionHref="/id"
        actionLabel="عرض البطاقة"
      >
        <Link
          href="/id"
          className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 hover:bg-brand-50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <QrCode className="h-6 w-6" />
          </span>
          <div>
            <div className="font-medium text-slate-700">
              اعرض هويتك الطبية وكود الطوارئ
            </div>
            <div className="text-sm text-slate-400">
              QR للوصول السريع لبياناتك وقت الطوارئ
            </div>
          </div>
        </Link>
      </SectionCard>

      <SectionCard
        title="حجوزاتي الأخيرة"
        actionHref="/appointments"
        actionLabel="كل الحجوزات"
      >
        {d.recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="لا توجد حجوزات بعد"
            hint="ابحث عن مقدم خدمة واحجز موعدك الأول"
            ctaHref="/search"
            ctaLabel="ابحث الآن"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">مقدم الخدمة</th>
                  <th className="pb-2 font-medium">الحالة</th>
                  <th className="pb-2 font-medium">الموعد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {d.recent.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-medium text-slate-700">
                      {a.providerName}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {fmtDate(a.scheduledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
