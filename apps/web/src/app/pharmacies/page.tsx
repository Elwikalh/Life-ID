import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import {
  linkPharmacy,
  unlinkPharmacy,
  routePrescription,
} from "../../lib/rxRoutingActions"
import { t } from "../../lib/i18n"
import { getLang } from "../../lib/serverLang"
import type { Lang } from "../../lib/i18n"
import { Pill, Trash2, Send, MapPin, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

const RX_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  draft: { ar: "لم تُوجَّه بعد", en: "Draft (not routed)" },
  routed: { ar: "بانتظار رد الصيدلية", en: "Awaiting pharmacy" },
  accepted: { ar: "الصيدلية وفّرت الأدوية", en: "Pharmacy accepted" },
  unavailable: { ar: "لا توجد صيدلية متاحة", en: "No pharmacy available" },
  confirmed: { ar: "أكّد المريض الاستلام", en: "Patient confirmed" },
  delivered: { ar: "تم التسليم", en: "Delivered" },
  cancelled: { ar: "ملغية", en: "Cancelled" },
}

const RX_STATUS_CLS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  routed: "bg-amber-100 text-amber-700",
  accepted: "bg-sky-100 text-sky-700",
  unavailable: "bg-danger/10 text-danger",
  confirmed: "bg-brand-100 text-brand-700",
  delivered: "bg-brand-100 text-brand-700",
  cancelled: "bg-slate-100 text-slate-500",
}

const BANNERS: Record<
  string,
  { text: { ar: string; en: string }; ok: boolean }
> = {
  linked: {
    text: { ar: "تمت إضافة الصيدلية.", en: "Pharmacy added." },
    ok: true,
  },
  removed: {
    text: { ar: "تمت إزالة الصيدلية.", en: "Pharmacy removed." },
    ok: true,
  },
  routed: {
    text: {
      ar: "تم توجيه الروشتة للصيدلية الأولى.",
      en: "Prescription routed to the first pharmacy.",
    },
    ok: true,
  },
  empty: {
    text: { ar: "اختر صيدلية أولاً.", en: "Select a pharmacy first." },
    ok: false,
  },
  nopharmacy: {
    text: {
      ar: "أضف صيدلية واحدة على الأقل قبل التوجيه.",
      en: "Add at least one pharmacy before routing.",
    },
    ok: false,
  },
  notfound: {
    text: { ar: "الروشتة غير موجودة.", en: "Prescription not found." },
    ok: false,
  },
  fail: {
    text: { ar: "حصل خطأ، حاول تاني.", en: "Something went wrong, try again." },
    ok: false,
  },
}

type RxItem = { drug: string; dosage?: string }

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default async function PharmaciesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const role = (user.publicMetadata as { role?: string })?.role
  if (role !== "doctor") redirect("/dashboard")

  const lang: Lang = await getLang(role)

  const sp = await searchParams
  const banner = sp.ok ? BANNERS[sp.ok] : sp.error ? BANNERS[sp.error] : null

  const [pharmacies, links, prescriptions] = await Promise.all([
    prisma.user.findMany({
      where: { role: "pharmacy" },
      select: { id: true, fullName: true, city: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.pharmacyLink.findMany({
      where: { doctorId: user.id },
      orderBy: { priority: "asc" },
    }),
    prisma.prescription.findMany({
      where: { doctorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          include: { patient: { select: { fullName: true } } },
        },
      },
    }),
  ])

  const linkedIds = new Set(links.map((l) => l.pharmacyId))
  const available = pharmacies.filter((p) => !linkedIds.has(p.id))
  const nameById = new Map(pharmacies.map((p) => [p.id, p.fullName]))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" />
        {t({ ar: "رجوع للوحة", en: "Back to dashboard" }, lang)}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {t(
            {
              ar: "صيدلياتي وتوجيه الروشتات",
              en: "My Pharmacies & Prescription Routing",
            },
            lang,
          )}
        </h1>
        <p className="text-sm text-slate-500">
          {t(
            {
              ar: "اربط صيدلياتك بالأولوية، والروشتة تروح تلقائياً للأولى، ولو دوا ناقص تتحوّل للتالية.",
              en: "Link your pharmacies by priority. Prescriptions go to the first one automatically, and if a drug is missing they move to the next.",
            },
            lang,
          )}
        </p>
      </div>

      {banner && (
        <div
          className={
            "rounded-xl px-4 py-3 text-sm " +
            (banner.ok
              ? "bg-brand-50 text-brand-700"
              : "bg-danger/10 text-danger")
          }
        >
          {t(banner.text, lang)}
        </div>
      )}

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
          <Pill className="h-5 w-5 text-brand-500" />
          {t({ ar: "إضافة صيدلية", en: "Add pharmacy" }, lang)}
        </h2>
        {available.length === 0 ? (
          <p className="text-sm text-slate-500">
            {pharmacies.length === 0
              ? t(
                  {
                    ar: "لسه مفيش صيدليات مسجّلة على المنصة.",
                    en: "No pharmacies registered on the platform yet.",
                  },
                  lang,
                )
              : t(
                  {
                    ar: "كل الصيدليات المتاحة مربوطة بالفعل.",
                    en: "All available pharmacies are already linked.",
                  },
                  lang,
                )}
          </p>
        ) : (
          <form action={linkPharmacy} className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 text-sm">
              <span className="mb-1 block text-slate-600">
                {t({ ar: "الصيدلية", en: "Pharmacy" }, lang)}
              </span>
              <select
                name="pharmacyId"
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              >
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                    {p.city ? " — " + p.city : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-28 text-sm">
              <span className="mb-1 block text-slate-600">
                {t({ ar: "الأولوية", en: "Priority" }, lang)}
              </span>
              <input
                type="number"
                name="priority"
                min={1}
                max={99}
                defaultValue={links.length + 1}
                className="w-full rounded-lg border border-black/10 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              {t({ ar: "إضافة", en: "Add" }, lang)}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">
          {t(
            {
              ar: "صيدلياتي بالأولوية",
              en: "My Pharmacies by Priority",
            },
            lang,
          )}{" "}
          ({links.length})
        </h2>
        {links.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "لسه مربطتش أي صيدلية. أضف صيدلية عشان تقدر توجّه الروشتات.",
                en: "You haven't linked any pharmacy yet. Add one to route prescriptions.",
              },
              lang,
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {links.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {l.priority}
                  </span>
                  <span className="font-medium text-slate-700">
                    {l.pharmacyName}
                  </span>
                </div>
                <form action={unlinkPharmacy}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-xs text-slate-500 hover:border-danger/40 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t({ ar: "إزالة", en: "Remove" }, lang)}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">
          {t({ ar: "روشتاتي", en: "My Prescriptions" }, lang)}
        </h2>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "لسه مكتبتش أي روشتة. اكتب روشتة من صفحة الحجز الأول.",
                en: "You haven't written any prescriptions yet. Write one from the appointment page.",
              },
              lang,
            )}
          </p>
        ) : (
          <ul className="space-y-3">
            {prescriptions.map((rx) => {
              const items = Array.isArray(rx.items)
                ? (rx.items as unknown as RxItem[])
                : []
              const pharmacyName = rx.currentPharmacyId
                ? nameById.get(rx.currentPharmacyId)
                : null
              return (
                <li
                  key={rx.id}
                  className="rounded-xl border border-black/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-700">
                        {rx.appointment?.patient?.fullName ??
                          t({ ar: "مريض", en: "Patient" }, lang)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {fmtDate(rx.createdAt)} · {items.length}{" "}
                        {t({ ar: "دواء", en: "item(s)" }, lang)}
                      </p>
                    </div>
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        (RX_STATUS_CLS[rx.status] ??
                          "bg-slate-100 text-slate-600")
                      }
                    >
                      {RX_STATUS_LABELS[rx.status]
                        ? t(RX_STATUS_LABELS[rx.status], lang)
                        : rx.status}
                    </span>
                  </div>

                  {pharmacyName && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {t(
                        { ar: "الصيدلية الحالية:", en: "Current pharmacy:" },
                        lang,
                      )}{" "}
                      {pharmacyName}
                    </p>
                  )}

                  {(rx.status === "draft" || rx.status === "unavailable") && (
                    <form action={routePrescription} className="mt-3">
                      <input
                        type="hidden"
                        name="prescriptionId"
                        value={rx.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {rx.status === "unavailable"
                          ? t(
                              {
                                ar: "إعادة التوجيه للصيدلية الأولى",
                                en: "Re-route to first pharmacy",
                              },
                              lang,
                            )
                          : t(
                              { ar: "توجيه للصيدلية", en: "Route to pharmacy" },
                              lang,
                            )}
                      </button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
