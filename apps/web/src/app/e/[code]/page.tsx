import { prisma } from "@life-id/db"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EmergencyPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const medId = await prisma.medicalId.findUnique({
    where: { qrCode: code },
    include: { user: true },
  })
  if (!medId) notFound()

  const allergies = medId.allergies.join("، ")
  const chronic = medId.chronicConditions.join("، ")
  const meds = medId.medications.join("، ")
  const emergencyContact = medId.emergencyName
    ? `${medId.emergencyName}${
        medId.emergencyPhone ? " — " + medId.emergencyPhone : ""
      }`
    : null

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="overflow-hidden rounded-2xl border border-danger/20 bg-white shadow-sm">
        <div className="bg-danger px-5 py-4 text-white">
          <p className="text-lg font-bold">🚨 معلومات طوارئ طبية</p>
          <p className="mt-1 text-sm opacity-90">{medId.user.fullName}</p>
        </div>
        <div className="divide-y divide-black/5">
          <Row label="فصيلة الدم" value={medId.bloodType} big danger />
          <Row label="الحساسية" value={allergies} />
          <Row label="أمراض مزمنة" value={chronic} />
          <Row label="أدوية حالية" value={meds} />
          <Row label="اتصال الطوارئ" value={emergencyContact} />
        </div>
      </div>

      {medId.emergencyPhone && (
        <a
          href={`tel:${medId.emergencyPhone}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          📞 اتصل بشخص الطوارئ
        </a>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Life ID — بطاقة الطوارئ الطبية
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  big,
  danger,
}: {
  label: string
  value?: string | null
  big?: boolean
  danger?: boolean
}) {
  const has = !!(value && value.length)
  return (
    <div className="px-5 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={
          (big ? "text-lg font-bold " : "text-sm font-medium ") +
          (has ? (danger ? "text-danger" : "text-slate-700") : "text-slate-300")
        }
      >
        {has ? value : "—"}
      </p>
    </div>
  )
}
