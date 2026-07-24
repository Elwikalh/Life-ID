import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { pharmacyRespond, markDelivered } from "../../lib/rxRoutingActions"
import { Check, X, Truck, Home, MapPin, ArrowRight, Phone } from "lucide-react"

export const dynamic = "force-dynamic"

const DELIVERY_LABELS: Record<string, string> = {
  pickup: "استلام من الصيدلية",
  home: "توصيل للمنزل",
}

const BANNERS: Record<string, { text: string; ok: boolean }> = {
  accepted: {
    text: "تم تأكيد توفّر الأدوية. بانتظار تأكيد المريض.",
    ok: true,
  },
  forwarded: { text: "تم تحويل الروشتة للصيدلية التالية.", ok: true },
  nostock: { text: "تم إبلاغ الطبيب أن مفيش صيدلية متاحة.", ok: true },
  delivered: { text: "تم تسجيل التسليم.", ok: true },
  fail: { text: "حصل خطأ، حاول تاني.", ok: false },
}

type RxItem = { drug: string; dosage?: string }

export default async function PharmacyInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const role = (user.publicMetadata as { role?: string })?.role
  if (role !== "pharmacy") redirect("/dashboard")

  const sp = await searchParams
  const banner = sp.ok ? BANNERS[sp.ok] : sp.error ? BANNERS[sp.error] : null

  const orders = await prisma.prescription.findMany({
    where: {
      currentPharmacyId: user.id,
      status: { in: ["routed", "accepted", "confirmed"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      appointment: {
        include: {
          patient: { select: { fullName: true } },
          provider: { select: { fullName: true } },
        },
      },
    },
  })

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للوحة
      </Link>

      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">روشتات واردة</h1>
        <p className="mt-1 text-sm text-slate-500">
          الروشتات اللي وصلتك من الأطباء. أكّد التوفّر أو حوّلها لو الدوا ناقص.
        </p>
      </div>

      {banner && (
        <div
          className={
            "mb-4 rounded-xl px-4 py-3 text-sm " +
            (banner.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700")
          }
        >
          {banner.text}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          لا توجد روشتات واردة حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((rx) => {
            const items = Array.isArray(rx.items)
              ? (rx.items as unknown as RxItem[])
              : []
            return (
              <div
                key={rx.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">
                    المريض: {rx.appointment?.patient?.fullName ?? "—"}
                  </div>
                  <div className="text-xs text-slate-400">
                    الطبيب: {rx.appointment?.provider?.fullName ?? "—"}
                  </div>
                </div>

                <ul className="mb-4 space-y-1">
                  {items.map((it, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {it.drug}
                      </span>
                      {it.dosage ? (
                        <span className="text-xs text-slate-400">
                          {it.dosage}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {rx.status === "routed" && (
                  <div className="flex flex-wrap gap-2">
                    <form action={pharmacyRespond}>
                      <input
                        type="hidden"
                        name="prescriptionId"
                        value={rx.id}
                      />
                      <input type="hidden" name="decision" value="available" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                      >
                        <Check className="h-4 w-4" />
                        الأدوية متوفّرة
                      </button>
                    </form>
                    <form action={pharmacyRespond}>
                      <input
                        type="hidden"
                        name="prescriptionId"
                        value={rx.id}
                      />
                      <input type="hidden" name="decision" value="nostock" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" />
                        دوا ناقص — حوّل للتالية
                      </button>
                    </form>
                  </div>
                )}

                {rx.status === "accepted" && (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    بانتظار تأكيد المريض لطريقة الاستلام.
                  </div>
                )}

                {rx.status === "confirmed" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        {rx.deliveryMethod === "home" ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {DELIVERY_LABELS[rx.deliveryMethod ?? "pickup"]}
                      </span>
                      {rx.deliveryMethod === "home" && rx.patientAddress && (
                        <span className="text-xs text-slate-400">
                          العنوان: {rx.patientAddress}
                        </span>
                      )}
                      {rx.patientPhone && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Phone className="h-3.5 w-3.5" />
                          {rx.patientPhone}
                        </span>
                      )}
                    </div>

                    <form
                      action={markDelivered}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input
                        type="hidden"
                        name="prescriptionId"
                        value={rx.id}
                      />
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">
                          قيمة الفاتورة (ج.م)
                        </label>
                        <input
                          type="number"
                          name="invoiceTotal"
                          min="0"
                          step="1"
                          placeholder="0"
                          className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                      >
                        <Truck className="h-4 w-4" />
                        تم التسليم
                      </button>
                    </form>
                    <p className="text-xs text-slate-400">
                      لو دخّلت قيمة الفاتورة، هيتسجّل تلقائياً استحقاق الطبيب
                      حسب نسبته المتفق عليها.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
