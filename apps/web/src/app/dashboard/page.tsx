import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import {
  getProviderData,
  getPatientData,
  getPharmaData,
  getRepSelfData,
} from "../../lib/dashboard"
import { setAppointmentStatus } from "../../lib/appointmentActions"
import {
  KpiCard,
  SectionCard,
  EmptyState,
  QuickAction,
  Badge,
} from "../../components/dash"
import { t, ROLE_LABELS } from "../../lib/i18n"
import type { Lang } from "../../lib/i18n"
import { getLang } from "../../lib/serverLang"
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
  Search,
  Factory,
  Briefcase,
} from "lucide-react"

export const dynamic = "force-dynamic"

type DashProps = {
  userId: string
  name: string
  roleLabel: string
  lang: Lang
}

const APPT_ROLES: Role[] = [
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "emergency",
]

// Header icon per role (same shape, different symbol)
const PROVIDER_ICONS: Partial<Record<Role, typeof Stethoscope>> = {
  doctor: Stethoscope,
  clinic: Building2,
  hospital: Building2,
  pharmacy: Pill,
  lab: ClipboardList,
  radiology: ClipboardList,
  emergency: Stethoscope,
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
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

// Bilingual dashboard header (gradient hero)
function DashHeader({
  name,
  roleLabel,
  icon: Icon,
  lang,
}: {
  name: string
  roleLabel: string
  icon: typeof Stethoscope
  lang: Lang
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 p-6 text-white shadow-sm">
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-white/80">{roleLabel}</div>
          <h1 className="font-display truncate text-2xl font-extrabold">
            {t({ ar: "أهلاً،", en: "Welcome," }, lang)} {name}
          </h1>
        </div>
      </div>
      <div className="pointer-events-none absolute -start-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 start-28 h-32 w-32 rounded-full bg-white/5" />
    </div>
  )
}

function AppointmentAction({
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

  const lang: Lang = await getLang(meta.role)
  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email ||
    t({ ar: "مستخدم", en: "User" }, lang)

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, role: meta.role, fullName, email },
    })
  } catch {}

  const roleLabel = t(ROLE_LABELS[meta.role], lang)
  const props: DashProps = {
    userId: user.id,
    name: fullName,
    roleLabel,
    lang,
  }

  if (meta.role === "pharma_company") return <PharmaDashboard {...props} />
  if (meta.role === "medical_rep") return <RepDashboard {...props} />
  if (APPT_ROLES.includes(meta.role))
    return <ProviderDashboard {...props} icon={PROVIDER_ICONS[meta.role]} />
  return <PatientDashboard {...props} />
}

async function ProviderDashboard({
  userId,
  name,
  roleLabel,
  lang,
  icon,
}: DashProps & { icon?: typeof Stethoscope }) {
  const d = await getProviderData(userId)
  const HeaderIcon = icon ?? Stethoscope
  return (
    <div className="space-y-6">
      <DashHeader
        name={name}
        roleLabel={roleLabel}
        icon={HeaderIcon}
        lang={lang}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CalendarDays}
          label={t({ ar: "إجمالي الحجوزات", en: "Total appointments" }, lang)}
          value={fmt(d.totalAppointments)}
        />
        <KpiCard
          icon={Clock}
          label={t({ ar: "الحجوزات القادمة", en: "Upcoming" }, lang)}
          value={fmt(d.upcoming)}
        />
        <KpiCard
          icon={Users}
          label={t({ ar: "المرضى", en: "Patients" }, lang)}
          value={fmt(d.patientsCount)}
        />
        <KpiCard
          icon={Wallet}
          label={t({ ar: "الإيرادات", en: "Revenue" }, lang)}
          value={fmt(d.revenue) + t({ ar: " ج.م", en: " EGP" }, lang)}
        />
      </div>

      <SectionCard
        title={t({ ar: "أحدث الحجوزات", en: "Recent appointments" }, lang)}
        actionHref="/appointments"
        actionLabel={t({ ar: "كل الحجوزات", en: "All appointments" }, lang)}
      >
        {d.recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t(
              { ar: "لا توجد حجوزات بعد", en: "No appointments yet" },
              lang,
            )}
            hint={t(
              {
                ar: "هتظهر الحجوزات هنا أول ما يتم حجز موعد",
                en: "Appointments will appear here once one is booked",
              },
              lang,
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">
                    {t({ ar: "المريض", en: "Patient" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "القيمة", en: "Amount" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "الحالة", en: "Status" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "الموعد", en: "Date" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "الإجراءات", en: "Actions" }, lang)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {d.recent.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-medium text-slate-700">
                      {a.patientName}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {fmt(a.priceEGP)}
                      {t({ ar: " ج.م", en: " EGP" }, lang)}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                        {STATUS_LABELS[a.status]
                          ? t(STATUS_LABELS[a.status], lang)
                          : a.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {fmtDate(a.scheduledAt)}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        {a.status === "pending" && (
                          <>
                            <AppointmentAction
                              id={a.id}
                              status="confirmed"
                              label={t({ ar: "تأكيد", en: "Confirm" }, lang)}
                              variant="primary"
                            />
                            <AppointmentAction
                              id={a.id}
                              status="cancelled"
                              label={t({ ar: "رفض", en: "Decline" }, lang)}
                              variant="ghost"
                            />
                          </>
                        )}
                        {a.status === "confirmed" && (
                          <>
                            <AppointmentAction
                              id={a.id}
                              status="completed"
                              label={t({ ar: "إنهاء", en: "Complete" }, lang)}
                              variant="primary"
                            />
                            <Link href={"/rx/" + a.id} className={BTN_RX}>
                              {t({ ar: "روشتة", en: "Prescription" }, lang)}
                            </Link>
                          </>
                        )}
                        {a.status === "completed" && (
                          <Link href={"/rx/" + a.id} className={BTN_RX}>
                            {t({ ar: "روشتة", en: "Prescription" }, lang)}
                          </Link>
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
        )}
      </SectionCard>

      <QuickActionsRow
        lang={lang}
        actions={[
          {
            href: "/appointments",
            icon: CalendarDays,
            label: t({ ar: "كل الحجوزات", en: "All appointments" }, lang),
          },
          {
            href: "/search",
            icon: Search,
            label: t({ ar: "بحث", en: "Search" }, lang),
          },
          {
            href: "/id",
            icon: QrCode,
            label: t({ ar: "بطاقتي الطبية", en: "My medical ID" }, lang),
          },
          {
            href: "/profile/photo",
            icon: UserRound,
            label: t({ ar: "ملفي الشخصي", en: "My profile" }, lang),
          },
        ]}
      />
    </div>
  )
}

async function PatientDashboard({ userId, name, roleLabel, lang }: DashProps) {
  const d = await getPatientData(userId)
  return (
    <div className="space-y-6">
      <DashHeader
        name={name}
        roleLabel={roleLabel}
        icon={UserRound}
        lang={lang}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={CalendarDays}
          label={t({ ar: "إجمالي حجوزاتي", en: "My appointments" }, lang)}
          value={fmt(d.total)}
        />
        <KpiCard
          icon={Clock}
          label={t({ ar: "الحجوزات القادمة", en: "Upcoming" }, lang)}
          value={fmt(d.upcoming)}
        />
        <KpiCard
          icon={Stethoscope}
          label={t({ ar: "مقدمو الخدمة", en: "Providers" }, lang)}
          value={fmt(d.providersCount)}
        />
      </div>

      <SectionCard
        title={t({ ar: "أحدث حجوزاتي", en: "My recent appointments" }, lang)}
        actionHref="/appointments"
        actionLabel={t({ ar: "كل الحجوزات", en: "All appointments" }, lang)}
      >
        {d.recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t(
              { ar: "لا توجد حجوزات بعد", en: "No appointments yet" },
              lang,
            )}
            hint={t(
              {
                ar: "ابحث عن طبيب أو مقدم خدمة واحجز موعدك الأول",
                en: "Search for a doctor or provider and book your first appointment",
              },
              lang,
            )}
            ctaHref="/search"
            ctaLabel={t({ ar: "ابحث الآن", en: "Search now" }, lang)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">
                    {t({ ar: "مقدم الخدمة", en: "Provider" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "الحالة", en: "Status" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "الموعد", en: "Date" }, lang)}
                  </th>
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
                        {STATUS_LABELS[a.status]
                          ? t(STATUS_LABELS[a.status], lang)
                          : a.status}
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

      <QuickActionsRow
        lang={lang}
        actions={[
          {
            href: "/search",
            icon: Search,
            label: t({ ar: "ابحث عن طبيب", en: "Find a doctor" }, lang),
          },
          {
            href: "/appointments",
            icon: CalendarDays,
            label: t({ ar: "حجوزاتي", en: "My appointments" }, lang),
          },
          {
            href: "/id",
            icon: QrCode,
            label: t({ ar: "بطاقتي الطبية", en: "My medical ID" }, lang),
          },
          {
            href: "/profile/photo",
            icon: UserRound,
            label: t({ ar: "ملفي الشخصي", en: "My profile" }, lang),
          },
        ]}
      />
    </div>
  )
}

async function PharmaDashboard({ userId, name, roleLabel, lang }: DashProps) {
  const d = await getPharmaData(userId)
  return (
    <div className="space-y-6">
      <DashHeader
        name={name}
        roleLabel={roleLabel}
        icon={Factory}
        lang={lang}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Package}
          label={t({ ar: "المنتجات", en: "Products" }, lang)}
          value={fmt(d.productsCount)}
          href="/profile/products"
        />
        <KpiCard
          icon={Users}
          label={t({ ar: "المندوبين", en: "Reps" }, lang)}
          value={fmt(d.repsCount)}
          href="/profile/reps"
        />
        <KpiCard
          icon={MapPin}
          label={t({ ar: "زيارات المندوبين", en: "Rep visits" }, lang)}
          value={fmt(d.visitsCount)}
        />
        <KpiCard
          icon={Handshake}
          label={t({ ar: "الشراكات", en: "Partnerships" }, lang)}
          value={fmt(d.partnershipsCount)}
          href="/profile/partnerships"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={t({ ar: "أحدث المنتجات", en: "Recent products" }, lang)}
          actionHref="/profile/products"
          actionLabel={t({ ar: "إدارة المنتجات", en: "Manage products" }, lang)}
        >
          {d.recentProducts.length === 0 ? (
            <EmptyState
              icon={Pill}
              title={t({ ar: "لسه مفيش منتجات", en: "No products yet" }, lang)}
              hint={t(
                {
                  ar: "أضف أول منتج لشركتك يظهر هنا",
                  en: "Add your company's first product to see it here",
                },
                lang,
              )}
              ctaHref="/profile/products"
              ctaLabel={t({ ar: "أضف منتج", en: "Add product" }, lang)}
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
                    {p.price != null
                      ? fmt(p.price) + t({ ar: " ج.م", en: " EGP" }, lang)
                      : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={t({ ar: "المندوبين", en: "Medical reps" }, lang)}
          actionHref="/profile/reps"
          actionLabel={t({ ar: "إدارة المندوبين", en: "Manage reps" }, lang)}
        >
          {d.topReps.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t({ ar: "لا يوجد مندوبين", en: "No reps yet" }, lang)}
              hint={t(
                {
                  ar: "أضف مندوبين لمتابعة زياراتهم",
                  en: "Add reps to track their visits",
                },
                lang,
              )}
              ctaHref="/profile/reps"
              ctaLabel={t({ ar: "إضافة مندوب", en: "Add rep" }, lang)}
            />
          ) : (
            <ul className="divide-y divide-black/5">
              {d.topReps.map((r, i) => (
                <li
                  key={i}
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
                  <span className="shrink-0 text-sm text-slate-500">
                    {fmt(r.visits) + t({ ar: " زيارة", en: " visits" }, lang)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t(
          { ar: "أحدث زيارات المندوبين", en: "Recent rep visits" },
          lang,
        )}
      >
        {d.recentVisits.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t({ ar: "لا توجد زيارات بعد", en: "No visits yet" }, lang)}
            hint={t(
              {
                ar: "هتظهر زيارات المندوبين للأطباء هنا",
                en: "Rep visits to doctors will appear here",
              },
              lang,
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2 font-medium">
                    {t({ ar: "الطبيب", en: "Doctor" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "المنطقة", en: "Region" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "النتيجة", en: "Outcome" }, lang)}
                  </th>
                  <th className="pb-2 font-medium">
                    {t({ ar: "التاريخ", en: "Date" }, lang)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {d.recentVisits.map((v, i) => (
                  <tr key={i}>
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
    </div>
  )
}

async function RepDashboard({ userId, name, roleLabel, lang }: DashProps) {
  const d = await getRepSelfData(userId)
  return (
    <div className="space-y-6">
      <DashHeader
        name={name}
        roleLabel={roleLabel}
        icon={Briefcase}
        lang={lang}
      />

      {!d.linked ? (
        <EmptyState
          icon={Briefcase}
          title={t(
            {
              ar: "لم يتم ربطك بشركة بعد",
              en: "You are not linked to a company yet",
            },
            lang,
          )}
          hint={t(
            {
              ar: "هتظهر بياناتك هنا بمجرد أن تربطك شركة أدوية بحسابها",
              en: "Your data will appear here once a pharma company links you to their account",
            },
            lang,
          )}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={Briefcase}
              label={t({ ar: "الشركة", en: "Company" }, lang)}
              value={d.companyName ?? "—"}
            />
            <KpiCard
              icon={MapPin}
              label={t({ ar: "المنطقة", en: "Region" }, lang)}
              value={d.region ?? "—"}
            />
            <KpiCard
              icon={Clock}
              label={t({ ar: "زياراتي", en: "My visits" }, lang)}
              value={fmt(d.visitsCount)}
            />
          </div>

          <SectionCard
            title={t({ ar: "أحدث زياراتي", en: "My recent visits" }, lang)}
          >
            {d.recentVisits.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={t(
                  { ar: "لا توجد زيارات بعد", en: "No visits yet" },
                  lang,
                )}
                hint={t(
                  {
                    ar: "سجّل زياراتك للأطباء عشان تظهر هنا",
                    en: "Log your visits to doctors to see them here",
                  },
                  lang,
                )}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="pb-2 font-medium">
                        {t({ ar: "الطبيب", en: "Doctor" }, lang)}
                      </th>
                      <th className="pb-2 font-medium">
                        {t({ ar: "المنطقة", en: "Region" }, lang)}
                      </th>
                      <th className="pb-2 font-medium">
                        {t({ ar: "النتيجة", en: "Outcome" }, lang)}
                      </th>
                      <th className="pb-2 font-medium">
                        {t({ ar: "التاريخ", en: "Date" }, lang)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {d.recentVisits.map((v, i) => (
                      <tr key={i}>
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

function QuickActionsRow({
  actions,
  lang,
}: {
  actions: { href: string; icon: typeof Stethoscope; label: string }[]
  lang: Lang
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="font-display mb-4 font-bold text-slate-800">
        {t({ ar: "إجراءات سريعة", en: "Quick actions" }, lang)}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <QuickAction key={a.href} href={a.href} icon={a.icon} label={a.label} />
        ))}
      </div>
    </div>
  )
}
