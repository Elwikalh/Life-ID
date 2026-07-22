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
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للوحة
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">روشتات واردة</h1>
        <p className="text-sm text-slate-500">
          الروشتات اللي وصلتك من الأطباء. أكّد التوفّر أو حوّلها لو الدوا ناقص.
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

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          لا توجد روشتات واردة حالياً.
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((rx) => {
            const items = Array.isArray(rx.items)
              ? (rx.items as unknown as RxItem[])
              : []
            return (
              <li
                key={rx.id}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      المريض: {rx.appointment?.patient?.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      الطبيب: {rx.appointment?.provider?.fullName ?? "—"}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
                  {items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="font-medium text-slate-700">{it.drug}</span>
                      {it.dosage ? (
                        <span className="text-slate-500">{it.dosage}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {rx.status === "routed" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={pharmacyRespond}>
                      <input type="hidden" name="prescriptionId" value={rx.id} />
                      <input type="hidden" name="decision" value="available" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                      >
                        <Check className="h-4 w-4" />
                        الأدوية متوفّرة
                      </button>
                    </form>
                    <form action={pharmacyRespond}>
                      <input type="hidden" name="prescriptionId" value={rx.id} />
                      <input type="hidden" name="decision" value="unavailable" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger"
                      >
                        <X className="h-4 w-4" />
                        دوا ناقص — حوّل للتالية
                      </button>
                    </form>
                  </div>
                )}

                {rx.status === "accepted" && (
                  <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">
                    بانتظار تأكيد المريض لطريقة الاستلام.
                  </p>
                )}

                {rx.status === "confirmed" && (
                  <div className="mt-4 space-y-2">
                    <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                      <p className="flex items-center gap-1 font-medium">
                        {rx.deliveryMethod === "home" ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {DELIVERY_LABELS[rx.deliveryMethod ?? "pickup"]}
                      </p>
                      {rx.deliveryMethod === "home" && rx.patientAddress && (
                        <p className="mt-1 text-brand-600">
                          العنوان: {rx.patientAddress}
                        </p>
                      )}
                      {rx.patientPhone && (
                        <p className="mt-1 flex items-center gap-1 text-brand-600">
                          <Phone className="h-3.5 w-3.5" />
                          {rx.patientPhone}
                        </p>
                      )}
                    </div>
                    <form action={markDelivered}>
                      <input type="hidden" name="prescriptionId" value={rx.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                      >
                        <Truck className="h-4 w-4" />
                        تم التسليم
                      </button>
                    </form>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
