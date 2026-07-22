import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { savePrescription } from "../../../lib/prescriptionActions"
import { ArrowRight, Pill } from "lucide-react"

export const dynamic = "force-dynamic"

type RxItem = { drug: string; dosage?: string }

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function RxPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const { appointmentId } = await params

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { fullName: true } },
      provider: { select: { fullName: true } },
      prescription: true,
    },
  })
  if (!appt) notFound()

  const isProvider = appt.providerId === user.id
  const isPatient = appt.patientId === user.id
  if (!isProvider && !isPatient) notFound()

  const rawItems = appt.prescription?.items
  const items: RxItem[] = Array.isArray(rawItems) ? (rawItems as unknown as RxItem[]) : []
  const existingText = items
    .map((i) => (i.dosage ? i.drug + " - " + i.dosage : i.drug))
    .join("\n")

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href={isProvider ? "/dashboard" : "/appointments"}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowRight className="h-4 w-4" /> رجوع
      </Link>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-slate-800">روشتة طبية</div>
            <div className="text-sm text-slate-400">{fmtDate(appt.scheduledAt)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">المريض</div>
            <div className="font-medium text-slate-700">{appt.patient?.fullName ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">مقدم الخدمة</div>
            <div className="font-medium text-slate-700">{appt.provider?.fullName ?? "—"}</div>
          </div>
        </div>

        {isProvider ? (
          <form action={savePrescription} className="mt-6 space-y-3">
            <input type="hidden" name="appointmentId" value={appt.id} />
            <label className="block text-sm font-medium text-slate-600">
              الأدوية{" "}
              <span className="text-slate-400">(دواء في كل سطر — مثال: بنادول 500 - قرص كل 8 ساعات)</span>
            </label>
            <textarea
              name="items"
              defaultValue={existingText}
              rows={8}
              placeholder={"بنادول 500 - قرص كل 8 ساعات\nأوجمنتين 1g - مرتين يوميًا"}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm leading-7 outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
            >
              حفظ الروشتة
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <div className="mb-2 text-sm font-medium text-slate-600">الأدوية الموصوفة</div>
            {items.length === 0 ? (
              <div className="rounded-xl border border-black/5 bg-slate-50 p-6 text-center text-sm text-slate-400">
                لسه مفيش روشتة لهذا الحجز.
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm"
                  >
                    <Pill className="mt-0.5 h-4 w-4 text-brand-500" />
                    <div>
                      <div className="font-medium text-slate-800">{it.drug}</div>
                      {it.dosage ? <div className="text-sm text-slate-500">{it.dosage}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
