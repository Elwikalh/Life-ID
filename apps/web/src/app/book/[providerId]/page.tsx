import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@life-id/db"
import { ROLE_LABELS } from "../../../lib/roles"
import type { Role } from "@life-id/types"

export const dynamic = "force-dynamic"

export default async function BookPage({
  params
}: {
  params: Promise<{ providerId: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const { providerId } = await params
  const provider = await prisma.user.findUnique({ where: { id: providerId } })
  if (!provider) notFound()

  async function book(formData: FormData) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")

    const when = formData.get("scheduledAt")
    if (typeof when !== "string" || !when) return

    const email = u.emailAddresses?.[0]?.emailAddress ?? null
    const fullName =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || email || "مستخدم"
    const meta = u.publicMetadata as { role?: Role }

    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, role: meta.role ?? "patient", fullName, email }
    })

    await prisma.appointment.create({
      data: {
        patientId: u.id,
        providerId,
        scheduledAt: new Date(when),
        status: "pending"
      }
    })
    redirect("/appointments")
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">حجز موعد</h1>
      <div className="mt-4 rounded-2xl border border-black/10 p-4">
        <div className="font-display font-bold">{provider.fullName}</div>
        <div className="text-sm text-brand-600">{ROLE_LABELS[provider.role]}</div>
      </div>
      <form action={book} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">اختر التاريخ والوقت</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">تأكيد الحجز</button>
          <a href="/search" className="rounded-xl border border-black/10 px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-50">رجوع</a>
        </div>
      </form>
    </main>
  )
}
