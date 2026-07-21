import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { ROLE_LABELS } from "../../lib/roles"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "تم",
  cancelled: "ملغي"
}

export default async function AppointmentsPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const appts = await prisma.appointment.findMany({
    where: { patientId: user.id },
    include: { provider: true },
    orderBy: { scheduledAt: "desc" },
    take: 50
  })

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">مواعيدي</h1>
      <div className="mt-6 space-y-3">
        {appts.length === 0 && (
          <p className="text-slate-400">
            لسه مفيش حجوزات. <Link href="/search" className="text-brand-600 underline">احجز دلوقتي</Link>
          </p>
        )}
        {appts.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-2xl border border-black/10 p-4">
            <div>
              <div className="font-display font-bold">{a.provider.fullName}</div>
              <div className="text-sm text-brand-600">{ROLE_LABELS[a.provider.role]}</div>
              <div className="mt-1 text-sm text-slate-500">
                {new Date(a.scheduledAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {STATUS_LABELS[a.status] ?? a.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}
