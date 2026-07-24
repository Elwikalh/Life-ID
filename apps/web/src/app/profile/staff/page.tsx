import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { t, type Lang } from "../../../lib/i18n"
import { getLang } from "../../../lib/serverLang"
import { addStaff, removeStaff } from "../../../lib/staffActions"
import { PROVIDER_PERMISSION_GROUPS } from "../../../lib/permissions"
import PermissionsGrid from "../../../components/PermissionsGrid"
import {
  Users,
  UserPlus,
  Trash2,
  Phone,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
} from "lucide-react"

export const dynamic = "force-dynamic"

const PROVIDER_ROLES: Role[] = [
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "emergency",
  "pharma_company",
]

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (!PROVIDER_ROLES.includes(meta.role)) redirect("/dashboard")

  const lang: Lang = await getLang(meta.role)

  const [staff, branches] = await Promise.all([
    prisma.staffMembership.findMany({
      where: { providerId: user.id },
      include: { member: true, branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({
      where: { providerId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const sp = await searchParams
  const saved = sp.saved === "1"
  const removed = sp.removed === "1"
  const errorCode = typeof sp.error === "string" ? sp.error : null
  const errorText = errorCode
    ? errorCode === "identifier"
      ? t(
          {
            ar: "اكتب رقم الموبايل أو الرقم القومي.",
            en: "Enter a mobile or national ID.",
          },
          lang,
        )
      : errorCode === "notfound"
        ? t(
            {
              ar: "مفيش حساب بالرقم ده — لازم الموظف يسجّل في التطبيق الأول.",
              en: "No account with this number — the staff member must register first.",
            },
            lang,
          )
        : errorCode === "self"
          ? t({ ar: "مينفعش تضيف نفسك.", en: "You can't add yourself." }, lang)
          : t({ ar: "حصل خطأ، حاول تاني.", en: "Something went wrong." }, lang)
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            {t({ ar: "الموظفون والصلاحيات", en: "Staff & permissions" }, lang)}
          </h1>
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "أضف موظفينك وحدّد صلاحيات كل واحد ووظيفته وفرعه.",
                en: "Add staff and set each one's permissions, job title and branch.",
              },
              lang,
            )}
          </p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t({ ar: "تم حفظ الموظف.", en: "Staff member saved." }, lang)}
        </div>
      )}
      {removed && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t({ ar: "تم حذف الموظف.", en: "Staff member removed." }, lang)}
        </div>
      )}
      {errorText && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorText}
        </div>
      )}

      <form
        action={addStaff}
        className="mb-8 space-y-5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UserPlus className="h-4 w-4 text-brand-500" />
          {t({ ar: "إضافة موظف", en: "Add staff member" }, lang)}
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <QrCode className="h-4 w-4" />
            {t(
              {
                ar: "الموظف يسجّل كمواطن أول، وبعدين ضيفه برقم موبايله أو رقمه القومي (نفس اللي في QR بطاقته).",
                en: "Staff register as citizens first, then add them by mobile or national ID (same as on their card QR).",
              },
              lang,
            )}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Phone className="h-4 w-4 text-brand-500" />
              {t({ ar: "موبايل / رقم قومي", en: "Mobile / national ID" }, lang)}
            </label>
            <input
              type="text"
              name="identifier"
              required
              className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Briefcase className="h-4 w-4 text-brand-500" />
              {t({ ar: "الوظيفة", en: "Job title" }, lang)}
            </label>
            <input
              type="text"
              name="jobTitle"
              placeholder={t(
                { ar: "سكرتير، فني...", en: "Secretary, technician..." },
                lang,
              )}
              className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Building2 className="h-4 w-4 text-brand-500" />
              {t({ ar: "الفرع", en: "Branch" }, lang)}
            </label>
            <select
              name="branchId"
              className="block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
            >
              <option value="">
                {t({ ar: "— بدون فرع", en: "— No branch" }, lang)}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">
            {t({ ar: "الصلاحيات", en: "Permissions" }, lang)}
          </div>
          <PermissionsGrid groups={PROVIDER_PERMISSION_GROUPS} lang={lang} />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <UserPlus className="h-4 w-4" />
          {t({ ar: "إضافة الموظف", en: "Add staff member" }, lang)}
        </button>
      </form>

      <div className="mb-3 text-sm font-semibold text-slate-700">
        {t({ ar: "الموظفون الحاليون", en: "Current staff" }, lang)} (
        {staff.length})
      </div>
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {t({ ar: "لا يوجد موظفون بعد.", en: "No staff yet." }, lang)}
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-800">
                  {s.member.fullName}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {s.jobTitle && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {s.jobTitle}
                    </span>
                  )}
                  {s.branch && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {s.branch.name}
                    </span>
                  )}
                  {s.member.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {s.member.phone}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                    {s.permissions.length}{" "}
                    {t({ ar: "صلاحية", en: "permissions" }, lang)}
                  </span>
                </div>
              </div>
              <form action={removeStaff}>
                <input type="hidden" name="membershipId" value={s.id} />
                <button
                  type="submit"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-danger/10 hover:text-danger"
                  aria-label="remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
