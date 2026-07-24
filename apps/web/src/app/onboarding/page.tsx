import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { t, type Lang, ROLE_LABELS } from "../../lib/i18n"
import { getLang } from "../../lib/serverLang"
import { completeRegistration } from "../../lib/registrationActions"
import {
  UserRound,
  Phone,
  IdCard,
  MapPin,
  Camera,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
} from "lucide-react"

export const dynamic = "force-dynamic"

const ROLES: Role[] = [
  "patient",
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "emergency",
  "pharma_company",
  "medical_rep",
]

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (meta.role)
    redirect(meta.status === "approved" ? "/dashboard" : "/pending")

  const lang: Lang = await getLang()
  const suggestedName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || ""

  const sp = await searchParams
  const errorCode = typeof sp.error === "string" ? sp.error : null
  const errorText =
    errorCode === "name"
      ? t({ ar: "اكتب اسمك الكامل.", en: "Enter your full name." }, lang)
      : errorCode === "phone"
        ? t({ ar: "رقم موبايل غير صالح.", en: "Invalid mobile number." }, lang)
        : errorCode === "nid"
          ? t(
              {
                ar: "رقم قومي غير صالح — أرقام فقط.",
                en: "Invalid national ID — digits only.",
              },
              lang,
            )
          : errorCode === "type"
            ? t(
                {
                  ar: "الملف المرفوع لازم يكون صورة.",
                  en: "Uploaded file must be an image.",
                },
                lang,
              )
            : errorCode === "size"
              ? t(
                  {
                    ar: "حجم الصورة كبير — الحد الأقصى 2 ميجابايت.",
                    en: "Image too large — max 2 MB.",
                  },
                  lang,
                )
              : errorCode === "dup"
                ? t(
                    {
                      ar: "الرقم القومي أو الموبايل مسجّل بالفعل على حساب آخر.",
                      en: "National ID or mobile already registered to another account.",
                    },
                    lang,
                  )
                : errorCode === "role" || errorCode === "fail"
                  ? t(
                      {
                        ar: "حصل خطأ، حاول تاني.",
                        en: "Something went wrong, please try again.",
                      },
                      lang,
                    )
                  : null

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            {t({ ar: "إنشاء حسابك", en: "Create your account" }, lang)}
          </h1>
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "أقل من دقيقة — بياناتك الأساسية وهويتك.",
                en: "Under a minute — your basic details and identity.",
              },
              lang,
            )}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        {t(
          {
            ar: "التفعيل فوري وهيطلعلك QR طبي على طول — والتوثيق يتراجع لاحقًا.",
            en: "Instant activation with a medical QR right away — verification is reviewed later.",
          },
          lang,
        )}
      </div>

      {errorText && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {errorText}
        </div>
      )}

      <form
        action={completeRegistration}
        className="space-y-5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t({ ar: "نوع الحساب", en: "Account type" }, lang)}
          </label>
          <select
            name="role"
            defaultValue="patient"
            className="block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(ROLE_LABELS[r], lang)}
              </option>
            ))}
          </select>
        </div>

        <Field
          icon={<UserRound className="h-4 w-4" />}
          label={t({ ar: "الاسم الكامل", en: "Full name" }, lang)}
        >
          <input
            type="text"
            name="fullName"
            defaultValue={suggestedName}
            required
            className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          />
        </Field>

        <Field
          icon={<Phone className="h-4 w-4" />}
          label={t({ ar: "رقم الموبايل", en: "Mobile number" }, lang)}
        >
          <input
            type="tel"
            name="phone"
            inputMode="tel"
            placeholder="01xxxxxxxxx"
            required
            className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          />
        </Field>

        <Field
          icon={<IdCard className="h-4 w-4" />}
          label={t({ ar: "الرقم القومي", en: "National ID number" }, lang)}
        >
          <input
            type="text"
            name="nationalId"
            inputMode="numeric"
            placeholder={t({ ar: "14 رقم", en: "14 digits" }, lang)}
            required
            className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          />
        </Field>

        <Field
          icon={<MapPin className="h-4 w-4" />}
          label={t({ ar: "المدينة (اختياري)", en: "City (optional)" }, lang)}
        >
          <input
            type="text"
            name="city"
            className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          />
        </Field>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t(
              {
                ar: "صورة البطاقة (اختياري — ممكن تضيفها لاحقًا)",
                en: "ID photos (optional — can add later)",
              },
              lang,
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoInput
              name="front"
              label={t({ ar: "الوجه الأمامي", en: "Front" }, lang)}
            />
            <PhotoInput
              name="back"
              label={t({ ar: "الوجه الخلفي", en: "Back" }, lang)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <UserPlus className="h-4 w-4" />
          {t({ ar: "إنشاء الحساب وإصدار QR", en: "Create account & issue QR" }, lang)}
        </button>
      </form>
    </div>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <span className="text-brand-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}

function PhotoInput({ name, label }: { name: string; label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/10 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Camera className="h-4 w-4" />
        {label}
      </div>
      <input
        type="file"
        name={name}
        accept="image/*"
        capture="environment"
        className="block w-full text-xs text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-600"
      />
    </div>
  )
}
