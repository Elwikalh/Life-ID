import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"
import { getProvider, CONSULTATION_FEE } from "../../../lib/providers"
import { ROLE_LABELS } from "../../../lib/roles"
import {
  ArrowRight,
  CalendarPlus,
  Stethoscope,
  MapPin,
  Wallet,
  Clock,
  Home,
} from "lucide-react"

export const dynamic = "force-dynamic"

const ERRORS: Record<string, string> = {
  empty: "من فضلك اختر موعدًا للحجز.",
  invalid: "الموعد الذي اخترته غير صالح.",
  past: "لا يمكن الحجز في وقت مضى. اختر موعدًا في المستقبل.",
  taken: "هذا الموعد محجوز بالفعل. اختر وقتًا آخر.",
  fail: "تعذّر إتمام الحجز. حاول مرة أخرى.",
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ providerId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const { providerId } = await params
  const { error } = await searchParams
  const provider = await getProvider(providerId)
  if (!provider) notFound()

  const fee = provider.consultationFee ?? CONSULTATION_FEE

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const minStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`

  async function book(formData: FormData) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")
    const when = String(formData.get("scheduledAt") || "")
    if (!when) redirect(`/book/${providerId}?error=empty`)
    const scheduledAt = new Date(when)
    if (isNaN(scheduledAt.getTime()))
      redirect(`/book/${providerId}?error=invalid`)
    if (scheduledAt.getTime() < Date.now())
      redirect(`/book/${providerId}?error=past`)

    const meta = u.publicMetadata as { role?: Role }
    const email = u.emailAddresses?.[0]?.emailAddress ?? null
    const fullName =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || email || "مستخدم"

    let outcome: "ok" | "taken" | "fail" = "fail"
    try {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: { id: u.id, role: meta.role ?? "patient", fullName, email },
      })
      const clash = await prisma.appointment.findFirst({
        where: {
          providerId,
          scheduledAt,
          status: { in: ["pending", "confirmed"] },
        },
        select: { id: true },
      })
      if (clash) {
        outcome = "taken"
      } else {
        await prisma.appointment.create({
          data: {
            patientId: u.id,
            providerId,
            scheduledAt,
            priceEGP: fee,
            discountPct: 0,
            status: "pending",
          },
        })
        outcome = "ok"
      }
    } catch {
      outcome = "fail"
    }
    if (outcome === "ok") redirect("/appointments")
    redirect(`/book/${providerId}?error=${outcome}`)
  }

  const hasHours = !!(provider.workFrom && provider.workTo)
  const hasDays = provider.workingDays.length > 0

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/search"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للبحث
      </Link>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
            {provider.fullName.slice(0, 1)}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">
              {provider.fullName}
            </p>
            <p className="text-sm text-slate-500">
              {ROLE_LABELS[provider.role]}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {provider.specialty && (
            <p className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-brand-500" />
              {provider.specialty}
            </p>
          )}
          {provider.city && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" />
              {provider.city}
            </p>
          )}
          {hasDays && (
            <p className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-brand-500" />
              أيام العمل: {provider.workingDays.join("، ")}
            </p>
          )}
          {hasHours && (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              من {provider.workFrom} إلى {provider.workTo}
            </p>
          )}
          {provider.homeService && (
            <p className="flex items-center gap-2">
              <Home className="h-4 w-4 text-brand-500" />
              يوفّر خدمة منزلية
            </p>
          )}
        </div>

        {provider.bio && (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
            {provider.bio}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-brand-700">
            <Wallet className="h-4 w-4" />
            رسوم الكشف
          </span>
          <span className="text-lg font-bold text-brand-700">{fee} ج.م</span>
        </div>
      </div>

      {error && ERRORS[error] && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">
          {ERRORS[error]}
        </p>
      )}

      <form
        action={book}
        className="mt-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <label className="mb-1 block text-sm font-medium text-slate-600">
          اختر موعدًا
        </label>
        <input
          type="datetime-local"
          name="scheduledAt"
          min={minStr}
          required
          className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
        />
        <button
          type="submit"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <CalendarPlus className="h-4 w-4" />
          تأكيد الحجز
        </button>
      </form>
    </div>
  )
}
