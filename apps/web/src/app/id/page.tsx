import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { randomUUID } from "crypto"
import Link from "next/link"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"

export const dynamic = "force-dynamic"

export default async function MedicalIdPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status !== "approved") redirect("/pending")

  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || email || "مستخدم"

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, role: meta.role, fullName, email }
  })

  let medId = await prisma.medicalId.findUnique({ where: { userId: user.id } })
  if (!medId) {
    medId = await prisma.medicalId.create({
      data: { userId: user.id, qrCode: randomUUID() }
    })
  }

  const h = await headers()
  const host = h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  const emergencyUrl = `${proto}://${host}/e/${medId.qrCode}`
  const qrDomain = "api." + "qrserver.com"
  const qrImg =
    "https" + "://" + qrDomain +
    "/v1/create-qr-code/?size=240x240&data=" +
    encodeURIComponent(emergencyUrl)

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">بطاقتي الطبية</h1>
      <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">الاسم</div>
            <div className="font-display text-lg font-bold">{fullName}</div>
            <div className="mt-3 text-sm text-slate-500">رقم الهوية الطبية</div>
            <div className="font-mono text-sm">{medId.qrCode.slice(0, 8).toUpperCase()}</div>
          </div>
          <img
            src={qrImg}
            alt="QR"
            width={120}
            height={120}
            className="rounded-xl border border-black/5"
          />
        </div>
        <div className="mt-6 space-y-1 rounded-2xl bg-brand-50 p-4 text-sm text-slate-600">
          <div><b>فصيلة الدم:</b> {medId.bloodType || "—"}</div>
          <div><b>الحساسية:</b> {medId.allergies.length ? medId.allergies.join("، ") : "—"}</div>
          <div><b>أمراض مزمنة:</b> {medId.chronicConditions.length ? medId.chronicConditions.join("، ") : "—"}</div>
          <div><b>اتصال طوارئ:</b> {medId.emergencyName ? `${medId.emergencyName}${medId.emergencyPhone ? " — " + medId.emergencyPhone : ""}` : "—"}</div>
        </div>
        <Link
          href="/id/edit"
          className="mt-6 inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          تعديل البيانات الطبية
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        امسح الكود في الطوارئ لعرض المعلومات المنقذة للحياة
      </p>
    </main>
  )
}
