import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"
import { getProvider, CONSULTATION_FEE } from "../../../lib/providers"
import { ROLE_LABELS } from "../../../lib/roles"
import { ArrowRight, CalendarPlus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BookPage({
  params,
}: {
  params: Promise<{ providerId: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const { providerId } = await params
  const provider = await getProvider(providerId)
  if (!provider) notFound()

  async function book(formData: FormData) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")
    const when = String(formData.get("scheduledAt") || "")
    if (!when) return
    const scheduledAt = new Date(when)
    if (isNaN(scheduledAt.getTime())) return

    const meta = u.publicMetadata as { role?: Role }
    const email = u.emailAddresses?.[0]?.emailAddress ?? null
    const fullName =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || email || "مستخدم"
    try {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: { id: u.id, role: meta.role ?? "patient", fullName, email },
      })
      await prisma.appointment.create({
        data: {
          patientId: u.id,
          providerId,
          scheduledAt,
          priceEGP: CONSULTATION_FEE,
          discountPct: 0,
          status: "pending",
        },
      })
    } catch {}
    redirect("/appointments")
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowRight className="h-4 w-4" /> رجوع للبحث
      </Link>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 font-display text-lg font-bold text-brand-600">
            {provider.fullName.slice(0, 1)}
          </div>
          <div>
            <div className="font-display text-lg font-bold text-slate-800">{provider.fullName}</div>
            <div className="text-sm text-slate-400">{ROLE_LABELS[provider.role]}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm">
          <span className="text-slate-600">رسوم الكشف</span>
          <span className="font-display text-lg font-extrabold text-brand-700">{CONSULTATION_FEE} ج.م</span>
        </div>

        <form action={book} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">اختر موعدًا</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
          >
            <CalendarPlus className="h-4 w-4" /> تأكيد الحجز
          </button>
        </form>
      </div>
    </main>
  )
}
