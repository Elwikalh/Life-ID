import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react"
import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { getUserDetail } from "../../../../lib/adminUsers"
import { ROLE_LABELS } from "../../../../lib/roles"
import UserActions from "./UserActions"

export const dynamic = "force-dynamic"

const OK_MSG: Record<string, string> = {
  role: "تم تحديث دور المستخدم بنجاح",
  approved: "تم تفعيل الحساب بنجاح",
  suspended: "تم تعليق الحساب",
}

const ERR_MSG: Record<string, string> = {
  denied: "لا تملك صلاحية تنفيذ هذا الإجراء",
  invalid: "بيانات غير صحيحة",
  self: "لا يمكنك تعديل دور أو حالة حسابك الشخصي من هنا",
  fail: "حصل خطأ، حاول مرة أخرى",
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; id: string }>
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const { section, id } = await params
  const { ok, error } = await searchParams
  const u = await getUserDetail(id)
  if (!u) notFound()

  const me = await currentUser()
  const isSelf = me?.id === u.id

  let status = "pending"
  try {
    const client = await clerkClient()
    const cu = await client.users.getUser(u.id)
    status = String(
      (cu.publicMetadata as { status?: string }).status || "pending",
    )
  } catch {}

  const initials = u.fullName?.trim()?.charAt(0) || "؟"

  return (
    <div className="space-y-6">
      <Link
        href={"/admin/" + section}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ChevronRight className="h-4 w-4" />
        رجوع للقائمة
      </Link>

      {ok && OK_MSG[ok] && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <CheckCircle2 className="h-4 w-4" />
          {OK_MSG[ok]}
        </div>
      )}
      {error && ERR_MSG[error] && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4" />
          {ERR_MSG[error]}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 font-display text-2xl font-extrabold text-brand-700">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold">{u.fullName}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="rounded-full bg-brand-50 px-3 py-0.5 font-medium text-brand-700">
              {ROLE_LABELS[u.role]}
            </span>
            <span className="text-slate-400">
              انضم في {new Date(u.createdAt).toLocaleDateString("ar-EG")}
            </span>
          </div>
        </div>
      </div>

      {/* أدوات الإدارة */}
      <UserActions
        userId={u.id}
        section={section}
        role={u.role}
        status={status}
        isSelf={isSelf}
      />

      {/* Info grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="معلومات التواصل">
          <InfoRow label="البريد الإلكتروني" value={u.email} />
          <InfoRow label="رقم الموبايل" value={u.phone} />
        </InfoCard>

        <InfoCard title="معلومات الحساب">
          <InfoRow label="الدور" value={ROLE_LABELS[u.role]} />
          <InfoRow label="المعرّف" value={u.id} mono />
          <div className="flex gap-3 pt-2">
            <Stat label="الحجوزات" value={u.appointmentsCount} />
            <Stat label="كمقدّم خدمة" value={u.providedCount} />
          </div>
        </InfoCard>
      </div>

      {u.medicalId && (
        <InfoCard title="البطاقة الطبية">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="فصيلة الدم" value={u.medicalId.bloodType} />
            <InfoRow label="كود البطاقة" value={u.medicalId.qrCode} mono />
            <InfoRow
              label="الحساسية"
              value={u.medicalId.allergies.join("، ")}
            />
            <InfoRow
              label="أمراض مزمنة"
              value={u.medicalId.chronicConditions.join("، ")}
            />
            <InfoRow
              label="أدوية حالية"
              value={u.medicalId.medications.join("، ")}
            />
            <InfoRow
              label="اتصال الطوارئ"
              value={
                u.medicalId.emergencyName
                  ? u.medicalId.emergencyName +
                    (u.medicalId.emergencyPhone
                      ? " — " + u.medicalId.emergencyPhone
                      : "")
                  : null
              }
            />
          </div>
        </InfoCard>
      )}
    </div>
  )
}

function InfoCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-3 font-display font-bold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className={
          "text-sm text-slate-700 " + (mono ? "font-mono text-xs" : "")
        }
      >
        {value && value.length ? value : "—"}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-2 text-center">
      <div className="font-display text-xl font-extrabold text-brand-700">
        {value}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}
