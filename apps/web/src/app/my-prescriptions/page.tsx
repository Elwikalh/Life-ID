import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { patientConfirm } from "../../lib/rxRoutingActions"
import { Pill, ArrowRight, MapPin, CheckCircle2, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

const RX_STATUS_LABELS: Record<string, string> = {
  draft: "قيد المراجعة من الطبيب",
  routed: "جاري البحث عن صيدلية",
  accepted: "الأدوية متوفّرة — أكّد الاستلام",
  unavailable: "مفيش صيدلية متاحة حالياً",
  confirmed: "تم التأكيد — جاري التجهيز",
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
  confirmed: { text: "تم تأكيد طلبك. الصيدلية هتجهّزه.", ok: true },
  address: { text: "اكتب عنوان التوصيل من فضلك.", ok: false },
  fail: { text: "حصل خطأ، حاول تاني.", ok: false },
}

type RxItem = { drug: string; dosage?: string }

export default async function MyPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const role = (user.publicMetadata as { role?: string })?.role
  if (role !== "patient") redirect("/dashboard")

  const sp = await searchParams
  const banner = sp.ok ? BANNERS[sp.ok] : sp.error ? BANNERS[sp.error] : null

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      appointment: {
        include: { provider: { select: { fullName: true } } },
      },
    },
  })

  const pharmacyIds = prescriptions
    .map((r) => r.currentPharmacyId)
    .filter((x): x is string => !!x)
  const pharmacies =
    pharmacyIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: pharmacyIds } },
          select: { id: true, fullName: true, city: true },
        })
      : []
  const pharmacyById = new Map(pharmacies.map((p) => [p.id, p]))

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
        <h1 className="text-2xl font-bold text-slate-800">روشتاتي</h1>
        <p className="text-sm text-slate-500">
          روشتاتك الإلكترونية وحالة تجهيزها من الصيدلية.
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

      {prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          لسه مفيش روشتات.
        </div>
      ) : (
        <ul className="space-y-4">
          {prescriptions.map((rx) => {
            const items = Array.isArray(rx.items)
              ? (rx.items as unknown as RxItem[])
              : []
            const pharmacy = rx.currentPharmacyId
              ? pharmacyById.get(rx.currentPharmacyId)
              : null
            return (
              <li
                key={rx.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      د. {rx.appointment?.provider?.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400">{items.length} دواء</p>
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

                <ul className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5 text-brand-500" />
                      <span className="font-medium text-slate-700">{it.drug}</span>
                      {it.dosage ? (
                        <span className="text-slate-400">— {it.dosage}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {pharmacy && rx.status !== "draft" && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    الصيدلية: {pharmacy.fullName}
                    {pharmacy.city ? " — " + pharmacy.city : ""}
                  </p>
                )}

                {rx.status === "accepted" && (
                  <form
                    action={patientConfirm}
                    className="mt-4 space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4"
                  >
                    <input type="hidden" name="prescriptionId" value={rx.id} />
                    <p className="text-sm font-medium text-slate-700">
                      اختر طريقة الاستلام:
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="method"
                          value="pickup"
                          defaultChecked
                        />
                        استلام من الصيدلية
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="method" value="home" />
                        توصيل للمنزل
                      </label>
                    </div>
                    <input
                      type="text"
                      name="address"
                      placeholder="عنوان التوصيل (لو اخترت التوصيل)"
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="رقم موبايل للتواصل (اختياري)"
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      تأكيد الطلب
                    </button>
                  </form>
                )}

                {rx.status === "confirmed" && (
                  <p className="mt-3 flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                    <Clock className="h-4 w-4" />
                    {rx.deliveryMethod === "home"
                      ? "طلبك بيتجهّز للتوصيل."
                      : "طلبك جاهز قريب للاستلام من الصيدلية."}
                  </p>
                )}

                {rx.status === "delivered" && (
                  <p className="mt-3 flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                    <CheckCircle2 className="h-4 w-4" />
                    تم تسليم الأدوية.
                  </p>
                )}

                {rx.status === "unavailable" && (
                  <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                    الأدوية مش متوفّرة في صيدليات طبيبك حالياً. تواصل مع طبيبك.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
