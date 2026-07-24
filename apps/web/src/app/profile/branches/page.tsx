import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { t, type Lang } from "../../../lib/i18n"
import { getLang } from "../../../lib/serverLang"
import { addBranch, deleteBranch } from "../../../lib/branchActions"
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  AlertTriangle,
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

export default async function BranchesPage({
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
  const branches = await prisma.branch.findMany({
    where: { providerId: user.id },
    orderBy: { createdAt: "asc" },
  })

  const sp = await searchParams
  const saved = sp.saved === "1"
  const removed = sp.removed === "1"
  const errorCode = typeof sp.error === "string" ? sp.error : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            {t({ ar: "الفروع", en: "Branches" }, lang)}
          </h1>
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "أضف فروع مقدم الخدمة واربط بها موظفيك.",
                en: "Add your branches and assign staff to them.",
              },
              lang,
            )}
          </p>
        </div>
      </div>

      {saved && (
        <Banner tone="ok">{t({ ar: "تم الحفظ.", en: "Saved." }, lang)}</Banner>
      )}
      {removed && (
        <Banner tone="ok">
          {t({ ar: "تم حذف الفرع.", en: "Branch deleted." }, lang)}
        </Banner>
      )}
      {errorCode && (
        <Banner tone="err">
          {errorCode === "name"
            ? t({ ar: "اكتب اسم الفرع.", en: "Enter a branch name." }, lang)
            : t(
                { ar: "حصل خطأ، حاول تاني.", en: "Something went wrong." },
                lang,
              )}
        </Banner>
      )}

      <form
        action={addBranch}
        className="mb-6 space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label={t({ ar: "اسم الفرع", en: "Branch name" }, lang)}
            required
          />
          <Input name="city" label={t({ ar: "المدينة", en: "City" }, lang)} />
          <Input
            name="address"
            label={t({ ar: "العنوان", en: "Address" }, lang)}
          />
          <Input
            name="phone"
            label={t({ ar: "التليفون", en: "Phone" }, lang)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="isMain"
            className="h-4 w-4 rounded border-black/20 text-brand-600"
          />
          {t({ ar: "الفرع الرئيسي", en: "Main branch" }, lang)}
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          {t({ ar: "إضافة فرع", en: "Add branch" }, lang)}
        </button>
      </form>

      {branches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {t({ ar: "لا توجد فروع بعد.", en: "No branches yet." }, lang)}
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  {b.name}
                  {b.isMain && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      <Star className="h-3 w-3" />
                      {t({ ar: "رئيسي", en: "Main" }, lang)}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {b.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {b.city}
                    </span>
                  )}
                  {b.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {b.phone}
                    </span>
                  )}
                  {b.address && <span>{b.address}</span>}
                </div>
              </div>
              <form action={deleteBranch}>
                <input type="hidden" name="branchId" value={b.id} />
                <button
                  type="submit"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-danger/10 hover:text-danger"
                  aria-label="delete"
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

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "err"
  children: React.ReactNode
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-danger/10 text-danger"
  const Icon = tone === "ok" ? CheckCircle2 : AlertTriangle
  return (
    <div
      className={
        "mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm " + cls
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {children}
    </div>
  )
}

function Input({
  name,
  label,
  required,
}: {
  name: string
  label: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        name={name}
        required={required}
        className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
      />
    </div>
  )
}
