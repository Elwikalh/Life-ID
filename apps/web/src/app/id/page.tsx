import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { randomUUID } from "crypto"
import Link from "next/link"
import type { ReactNode } from "react"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"
import {
  Pencil,
  ArrowRight,
  Droplet,
  AlertTriangle,
  Activity,
  Pill,
  PhoneCall,
} from "lucide-react"
import { IdActions } from "./IdActions"

export const dynamic = "force-dynamic"

export default async function MedicalIdPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status !== "approved") redirect("/pending")

  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email ||
    "مستخدم"

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, role: meta.role, fullName, email },
  })

  let medId = await prisma.medicalId.findUnique({ where: { userId: user.id } })
  if (!medId) {
    medId = await prisma.medicalId.create({
      data: { userId: user.id, qrCode: randomUUID() },
    })
  }

  const h = await headers()
  const host = h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  const emergencyUrl = `${proto}://${host}/e/${medId.qrCode}`
  const qrImg =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=" +
    encodeURIComponent(emergencyUrl)

  const emergencyContact = medId.emergencyName
    ? `${medId.emergencyName}${
        medId.emergencyPhone ? " — " + medId.emergencyPhone : ""
      }`
    : null

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">بطاقتي الطبية</h1>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
        >
          رجوع
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="bg-brand-500 px-5 py-4 text-white">
          <p className="text-xs opacity-80">Life ID — الهوية الطبية</p>
          <p className="mt-1 text-lg font-bold">{fullName}</p>
          <p className="mt-0.5 text-xs opacity-90">
            رقم الهوية: {medId.qrCode.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 border-b border-black/5 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImg}
            alt="رمز الطوارئ QR"
            width={200}
            height={200}
            className="rounded-xl border border-black/5"
          />
          <p className="text-center text-xs text-slate-500">
            امسح الكود في حالة الطوارئ لعرض المعلومات المنقذة للحياة
          </p>
        </div>

        <div className="divide-y divide-black/5">
          <InfoRow
            icon={<Droplet className="h-4 w-4" />}
            label="فصيلة الدم"
            value={medId.bloodType}
            highlight
          />
          <InfoRow
            icon={<AlertTriangle className="h-4 w-4" />}
            label="الحساسية"
            value={medId.allergies.join("، ")}
          />
          <InfoRow
            icon={<Activity className="h-4 w-4" />}
            label="أمراض مزمنة"
            value={medId.chronicConditions.join("، ")}
          />
          <InfoRow
            icon={<Pill className="h-4 w-4" />}
            label="أدوية حالية"
            value={medId.medications.join("، ")}
          />
          <InfoRow
            icon={<PhoneCall className="h-4 w-4" />}
            label="اتصال الطوارئ"
            value={emergencyContact}
          />
        </div>
      </div>

      <IdActions emergencyUrl={emergencyUrl} qrImg={qrImg} />

      <Link
        href="/id/edit"
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
      >
        <Pencil className="h-4 w-4" />
        تعديل البيانات الطبية
      </Link>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode
  label: string
  value?: string | null
  highlight?: boolean
}) {
  const has = !!(value && value.length)
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <span className="mt-0.5 text-brand-500">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p
          className={
            "text-sm " +
            (has
              ? highlight
                ? "font-bold text-danger"
                : "font-medium text-slate-700"
              : "text-slate-300")
          }
        >
          {has ? value : "غير مُسجّل"}
        </p>
      </div>
    </div>
  )
}
