import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { prisma } from "@life-id/db"
import { CalendarPlus, X } from "lucide-react"

export const dynamic = "force-dynamic"

type ApptRow = {
  id: string
  scheduledAt: Date
  status: string
  priceEGP: number
  provider: { fullName: string } | null
}

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

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

async function cancelAppointment(formData: FormData) {
  "use server"
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "")
  if (!id) return
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: { patientId: true, status: true },
    })
    if (
      appt &&
      appt.patientId === u.id &&
      (appt.status === "pending" || appt.status === "confirmed")
    ) {
      await prisma.appointment.update({ where: { id }, data: { status: "cancelled" } })
    }
  } catch {}
  revalidatePath("/appointments")
}

export default async function AppointmentsPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  let appts: ApptRow[] = []
  try {
    appts = (await prisma.appointment.findMany({
      where: { patientId: user.id },
      include: { provider: { select: { fullName: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    })) as ApptRow[]
  } catch {}

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">حجوزاتي</h1>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <CalendarPlus className="h-4 w-4" /> حجز جديد
        </Link>
      </div>

      {appts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-10 text-center text-slate-400 shadow-sm">
          مفيش حجوزات لسّة. اضغط "حجز جديد" للبدء.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appts.map((a) => {
            const canCancel = a.status === "pending" || a.status === "confirmed"
            return (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    {a.provider?.fullName ?? "—"}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-400">{fmtDate(a.scheduledAt)}</div>
                  <div className="mt-1 text-xs text-slate-400">{a.priceEGP} ج.م</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-xs font-medium " +
                      (STATUS_CLS[a.status] ?? "bg-slate-100 text-slate-500")
                    }
                  >
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                  {canCancel ? (
                    <form action={cancelAppointment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-danger/40 hover:text-danger"
                        title="إلغاء الحجز"
                      >
                        <X className="h-3.5 w-3.5" /> إلغاء
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
