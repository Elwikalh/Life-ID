import { prisma } from "@life-id/db"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EmergencyPage({
  params
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const medId = await prisma.medicalId.findUnique({
    where: { qrCode: code },
    include: { user: true }
  })
  if (!medId) notFound()

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
        <div className="text-lg font-extrabold text-red-600">🚨 معلومات طوارئ طبية</div>
      </div>
      <div className="mt-6 space-y-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <Row label="الاسم" value={medId.user.fullName} />
        <Row label="فصيلة الدم" value={medId.bloodType} big />
        <Row label="الحساسية" value={medId.allergies.join("، ")} danger />
        <Row label="أمراض مزمنة" value={medId.chronicConditions.join("، ")} />
        <Row label="أدوية حالية" value={medId.medications.join("، ")} />
        <Row
          label="اتصال طوارئ"
          value={medId.emergencyName ? `${medId.emergencyName}${medId.emergencyPhone ? " — " + medId.emergencyPhone : ""}` : ""}
        />
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Life ID — بطاقة الطوارئ الطبية</p>
    </main>
  )
}

function Row({
  label,
  value,
  big,
  danger
}: {
  label: string
  value?: string | null
  big?: boolean
  danger?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className={[
          big ? "text-2xl font-extrabold" : "font-semibold",
          danger ? "text-red-600" : "text-slate-800"
        ].join(" ")}
      >
        {value && value.length ? value : "—"}
      </div>
    </div>
  )
}
