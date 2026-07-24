import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { routeServiceOrder } from "../../lib/serviceOrderActions"
import { t, type Lang } from "../../lib/i18n"
import { getLang } from "../../lib/serverLang"
import { ArrowLeft, FlaskConical, ScanLine, ClipboardList } from "lucide-react"

export const dynamic = "force-dynamic"

type OrderItem = { name: string; note?: string }
type Partner = { partnerUserId: string | null; partnerName: string }
type OrderRow = {
  prescriptionId: string | null
  type: string
  status: string
  partnerName: string | null
  invoiceTotal: number | null
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function StatusBadge({ status, lang }: { status: string; lang: Lang }) {
  const map: Record<string, { ar: string; en: string; cls: string }> = {
    routed: {
      ar: "موجّه",
      en: "Routed",
      cls: "bg-amber-50 text-amber-700",
    },
    accepted: {
      ar: "قيد التنفيذ",
      en: "In progress",
      cls: "bg-blue-50 text-blue-700",
    },
    done: {
      ar: "مكتمل",
      en: "Completed",
      cls: "bg-brand-50 text-brand-700",
    },
  }
  const s = map[status] ?? map.routed
  return (
    <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + s.cls}>
      {t({ ar: s.ar, en: s.en }, lang)}
    </span>
  )
}

function RouteForm({
  prescriptionId,
  type,
  items,
  partners,
  lang,
}: {
  prescriptionId: string
  type: "lab" | "radiology"
  items: OrderItem[]
  partners: Partner[]
  lang: Lang
}) {
  if (partners.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {type === "lab"
          ? t(
              {
                ar: "لا يوجد معمل شريك. أضف معملًا من صفحة الشراكات أولًا.",
                en: "No partner lab yet. Add one from Partnerships first.",
              },
              lang,
            )
          : t(
              {
                ar: "لا يوجد مركز أشعة شريك. أضف مركزًا من صفحة الشراكات أولًا.",
                en: "No partner radiology center yet. Add one from Partnerships first.",
              },
              lang,
            )}
      </p>
    )
  }
  return (
    <form
      action={routeServiceOrder}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="prescriptionId" value={prescriptionId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="back" value="/lab-routing" />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <select
        name="partnerUserId"
        required
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
      >
        <option value="">
          {type === "lab"
            ? t({ ar: "اختر المعمل", en: "Select lab" }, lang)
            : t({ ar: "اختر مركز الأشعة", en: "Select center" }, lang)}
        </option>
        {partners.map((p) => (
          <option key={p.partnerUserId ?? ""} value={p.partnerUserId ?? ""}>
            {p.partnerName}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t({ ar: "توجيه", en: "Route" }, lang)}
      </button>
    </form>
  )
}

function Section({
  kind,
  items,
  order,
  partners,
  prescriptionId,
  lang,
}: {
  kind: "lab" | "radiology"
  items: OrderItem[]
  order?: OrderRow
  partners: Partner[]
  prescriptionId: string
  lang: Lang
}) {
  const Icon = kind === "lab" ? FlaskConical : ScanLine
  const heading =
    kind === "lab"
      ? t({ ar: "التحاليل", en: "Lab tests" }, lang)
      : t({ ar: "الأشعة", en: "Imaging" }, lang)
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-brand-600" />
        {heading}
      </div>
      <ul className="mb-3 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-slate-700">
            • {it.name}
            {it.note ? (
              <span className="text-slate-400"> — {it.note}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {order ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge status={order.status} lang={lang} />
          <span className="text-slate-600">{order.partnerName ?? ""}</span>
          {order.status === "done" && order.invoiceTotal ? (
            <span className="text-slate-500">
              — {t({ ar: "الفاتورة", en: "Invoice" }, lang)}:{" "}
              {order.invoiceTotal} {t({ ar: "ج.م", en: "EGP" }, lang)}
            </span>
          ) : null}
        </div>
      ) : (
        <RouteForm
          prescriptionId={prescriptionId}
          type={kind}
          items={items}
          partners={partners}
          lang={lang}
        />
      )}
    </div>
  )
}

export default async function LabRoutingPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role }
  const lang: Lang = await getLang(meta.role)
  const sp = await searchParams

  const [prescriptions, partnerships, orders] = await Promise.all([
    prisma.prescription.findMany({
      where: { doctorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        createdAt: true,
        labRequests: true,
        imagingRequests: true,
        appointment: {
          select: { patient: { select: { fullName: true } } },
        },
      },
    }),
    prisma.partnership.findMany({
      where: {
        ownerId: user.id,
        partnerType: { in: ["lab", "radiology"] },
        partnerUserId: { not: null },
      },
      select: { partnerUserId: true, partnerName: true, partnerType: true },
    }),
    prisma.serviceOrder.findMany({
      where: { doctorId: user.id, status: { not: "cancelled" } },
      select: {
        prescriptionId: true,
        type: true,
        status: true,
        partnerName: true,
        invoiceTotal: true,
      },
    }),
  ])

  const labPartners: Partner[] = partnerships.filter(
    (p) => p.partnerType === "lab",
  )
  const radPartners: Partner[] = partnerships.filter(
    (p) => p.partnerType === "radiology",
  )

  function findOrder(prescriptionId: string, type: string) {
    return orders.find(
      (o) => o.prescriptionId === prescriptionId && o.type === type,
    ) as OrderRow | undefined
  }

  const rows = prescriptions
    .map((rx) => ({
      id: rx.id,
      createdAt: rx.createdAt,
      patientName: rx.appointment?.patient?.fullName ?? "—",
      labs: asArray<OrderItem>(rx.labRequests),
      imaging: asArray<OrderItem>(rx.imagingRequests),
    }))
    .filter((r) => r.labs.length > 0 || r.imaging.length > 0)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t({ ar: "رجوع", en: "Back" }, lang)}
      </Link>

      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-brand-600" />
        <h1 className="text-xl font-bold text-slate-800">
          {t({ ar: "توجيه التحاليل والأشعة", en: "Route lab & imaging" }, lang)}
        </h1>
      </div>

      {sp?.ok === "routed" ? (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {t(
            { ar: "تم توجيه الطلب بنجاح.", en: "Order routed successfully." },
            lang,
          )}
        </div>
      ) : null}
      {sp?.error === "route" ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {t(
            {
              ar: "تعذّر توجيه الطلب. تأكد من اختيار الجهة.",
              en: "Could not route the order. Check the selected partner.",
            },
            lang,
          )}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          {t(
            {
              ar: "لا توجد روشتات بها طلبات تحاليل أو أشعة بعد.",
              en: "No prescriptions with lab or imaging requests yet.",
            },
            lang,
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium text-slate-800">
                  {r.patientName}
                </span>
                <span className="text-xs text-slate-400">
                  {fmtDate(r.createdAt)}
                </span>
              </div>
              <div className="space-y-3">
                {r.labs.length > 0 ? (
                  <Section
                    kind="lab"
                    items={r.labs}
                    order={findOrder(r.id, "lab")}
                    partners={labPartners}
                    prescriptionId={r.id}
                    lang={lang}
                  />
                ) : null}
                {r.imaging.length > 0 ? (
                  <Section
                    kind="radiology"
                    items={r.imaging}
                    order={findOrder(r.id, "radiology")}
                    partners={radPartners}
                    prescriptionId={r.id}
                    lang={lang}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
