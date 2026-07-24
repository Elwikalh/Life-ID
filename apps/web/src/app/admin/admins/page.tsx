import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { t, type Lang } from "../../../lib/i18n"
import { getLang } from "../../../lib/serverLang"
import { addAdmin } from "../../../lib/adminActions"
import { PLATFORM_PERMISSION_GROUPS } from "../../../lib/permissions"
import PermissionsGrid from "../../../components/PermissionsGrid"
import {
  ShieldCheck,
  UserPlus,
  Phone,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role }
  if (meta.role !== "super_admin") redirect("/dashboard")

  const lang: Lang = await getLang(meta.role)
  const admins = await prisma.user.findMany({
    where: { role: "super_admin" },
    orderBy: { createdAt: "desc" },
  })

  const sp = await searchParams
  const saved = sp.saved === "1"
  const errorCode = typeof sp.error === "string" ? sp.error : null
  const errorText = errorCode
    ? errorCode === "denied"
      ? t(
          {
            ar: "ممنوع — لازم تكون أدمن منصة.",
            en: "Denied — platform admin only.",
          },
          lang,
        )
      : errorCode === "notfound"
        ? t(
            {
              ar: "مفيش حساب بالرقم ده — لازم يسجّل في التطبيق الأول.",
              en: "No account with this number — must register first.",
            },
            lang,
          )
        : t({ ar: "حصل خطأ، حاول تاني.", en: "Something went wrong." }, lang)
    : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            {t({ ar: "أدمن المنصة", en: "Platform admins" }, lang)}
          </h1>
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "أضف مديري المنصة وحدّد صلاحياتهم على مستوى النظام كله.",
                en: "Add platform admins and set their system-wide permissions.",
              },
              lang,
            )}
          </p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t({ ar: "تم حفظ الأدمن.", en: "Admin saved." }, lang)}
        </div>
      )}
      {errorText && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorText}
        </div>
      )}

      <form
        action={addAdmin}
        className="mb-8 space-y-5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UserPlus className="h-4 w-4 text-brand-500" />
          {t({ ar: "إضافة أدمن", en: "Add admin" }, lang)}
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Phone className="h-4 w-4 text-brand-500" />
{t({ ar: "موبايل / ID التطبيق / QR", en: "Mobile / App ID / QR" }, lang)}
          </label>
          <input
            type="text"
            name="identifier"
            required
            className="block w-full max-w-sm rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">
            {t({ ar: "الصلاحيات", en: "Permissions" }, lang)}
          </div>
          <PermissionsGrid groups={PLATFORM_PERMISSION_GROUPS} lang={lang} />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <UserPlus className="h-4 w-4" />
          {t({ ar: "إضافة الأدمن", en: "Add admin" }, lang)}
        </button>
      </form>

      <div className="mb-3 text-sm font-semibold text-slate-700">
        {t({ ar: "الأدمن الحاليون", en: "Current admins" }, lang)} (
        {admins.length})
      </div>
      {admins.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {t({ ar: "لا يوجد أدمن بعد.", en: "No admins yet." }, lang)}
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="font-semibold text-slate-800">{a.fullName}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {a.email ?? a.phone ?? ""} · {a.adminPermissions.length}{" "}
                  {t({ ar: "صلاحية", en: "permissions" }, lang)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
