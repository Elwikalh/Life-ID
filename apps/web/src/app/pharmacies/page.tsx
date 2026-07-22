import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import {
  linkPharmacy,
  unlinkPharmacy,
  routePrescription,
} from "../../lib/rxRoutingActions"
import { Pill, Trash2, Send, MapPin, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

const RX_STATUS_LABELS: Record<string, string> = {
  draft: "لم تُوجَّه بعد",
  routed: "بانتظار رد الصيدلية",
  accepted: "الصيدلية وفّرت الأدوية",
  unavailable: "لا توجد صيدلية متاحة",
  confirmed: "أكّد المريض الاستلام",
  delivered: "تم التسليم",
  cancelled: "ملغية",
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

const BANNERS: Record<string, { text: string; ok: boolean }> = {
  linked: { text: "تمت إضافة الصيدلية.", ok: true },
  removed: { text: "تمت إزالة الصيدلية.", ok: true },
  routed: { text: "تم توجيه الروشتة للصيدلية الأولى.", ok: true },
  empty: { text: "اختر صيدلية أولاً.", ok: false },
  nopharmacy: {
    text: "أضف صيدلية واحدة على الأقل قبل التوجيه.",
    ok: false,
  },
  notfound: { text: "الروشتة غير موجودة.", ok: false },
  fail: { text: "حصل خطأ، حاول تاني.", ok: false },
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
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للوحة
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          صيدلياتي وتوجيه الروشتات
        </h1>
        <p className="text-sm text-slate-500">
          اربط صيدلياتك بالأولوية، والروشتة تروح تلقائياً للأولى، ولو دوا ناقص
          تتحوّل للتالية.
        </p>
      </div>

      {banner && (
        <div
          className={
            "rounded-xl px-4 py-3 text-sm " +
            (banner.ok ? "bg-brand-50 text-brand-700" : "bg-danger/10 text-danger")
          }
        >
          {banner.text}
        </div>
      )}

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
          <Pill className="h-5 w-5 text-brand-500" />
          إضافة صيدلية
        </h2>
        {available.length === 0 ? (
          <p className="text-sm text-slate-500">
            {pharmacies.length === 0
              ? "لسه مفيش صيدليات مسجّلة على المنصة."
              : "كل الصيدليات المتاحة مربوطة بالفعل."}
          </p>
        ) : (
          <form action={linkPharmacy} className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1 text-sm">
              <span className="mb-1 block text-slate-600">الصيدلية</span>
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
              <span className="mb-1 block text-slate-600">الأولوية</span>
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
              إضافة
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">
          صيدلياتي بالأولوية ({links.length})
        </h2>
        {links.length === 0 ? (
          <p className="text-sm text-slate-500">
            لسه مربطتش أي صيدلية. أضف صيدلية عشان تقدر توجّه الروشتات.
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
                    إزالة
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">روشتاتي</h2>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500">
            لسه مكتبتش أي روشتة. اكتب روشتة من صفحة الحجز الأول.
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
                <li key={rx.id} className="rounded-xl border border-black/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-700">
                        {rx.appointment?.patient?.fullName ?? "مريض"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {fmtDate(rx.createdAt)} · {items.length} دواء
                      </p>
                    </div>
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        (RX_STATUS_CLS[rx.status] ?? "bg-slate-100 text-slate-600")
                      }
                    >
                      {RX_STATUS_LABELS[rx.status] ?? rx.status}
                    </span>
                  </div>

                  {pharmacyName && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      الصيدلية الحالية: {pharmacyName}
                    </p>
                  )}

                  {(rx.status === "draft" || rx.status === "unavailable") && (
                    <form action={routePrescription} className="mt-3">
                      <input type="hidden" name="prescriptionId" value={rx.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {rx.status === "unavailable"
                          ? "إعادة التوجيه للصيدلية الأولى"
                          : "توجيه للصيدلية"}
                      </button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
