import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"
import { t, type Lang } from "../../../lib/i18n"
import { getLang } from "../../../lib/serverLang"
import { saveIdentity } from "../../../lib/identityActions"
import {
  ArrowLeft,
  IdCard,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function IdentityVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status !== "approved") redirect("/pending")

  const lang: Lang = await getLang(meta.role)
  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email ||
    t({ ar: "مستخدم", en: "User" }, lang)

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, role: meta.role, fullName, email },
  })

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      nationalId: true,
      idPhotoFrontUrl: true,
      idPhotoBackUrl: true,
      idVerified: true,
    },
  })

  const sp = await searchParams
  const saved = sp.saved === "1"
  const errorCode = typeof sp.error === "string" ? sp.error : null
  const errorText =
    errorCode === "nid"
      ? t(
          {
            ar: "رقم قومي غير صالح — أدخل أرقام فقط (14 رقم).",
            en: "Invalid national ID — digits only (14 digits).",
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
                  ar: "الرقم القومي ده مسجّل بالفعل على حساب آخر.",
                  en: "This national ID is already registered to another account.",
                },
                lang,
              )
            : errorCode === "fail"
              ? t(
                  {
                    ar: "حصل خطأ، حاول تاني.",
                    en: "Something went wrong, please try again.",
                  },
                  lang,
                )
              : null

  const verified = record?.idVerified ?? false

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/id"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t({ ar: "رجوع للهوية", en: "Back to ID" }, lang)}
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <IdCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800">
            {t({ ar: "توثيق الهوية", en: "Identity verification" }, lang)}
          </h1>
          <p className="text-sm text-slate-500">
            {t(
              {
                ar: "أدخل رقمك القومي وصورة البطاقة — التفعيل فوري والمراجعة لاحقة.",
                en: "Enter your national ID and card photos — instant activation, reviewed later.",
              },
              lang,
            )}
          </p>
        </div>
      </div>

      <div
        className={
          "mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm " +
          (verified
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700")
        }
      >
        {verified ? (
          <ShieldCheck className="h-5 w-5" />
        ) : (
          <ShieldAlert className="h-5 w-5" />
        )}
        {verified
          ? t({ ar: "هويتك موثّقة ✓", en: "Your identity is verified ✓" }, lang)
          : t(
              {
                ar: "الحساب مفعّل — التوثيق قيد المراجعة",
                en: "Account active — verification under review",
              },
              lang,
            )}
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {t(
            {
              ar: "تم حفظ بيانات الهوية بنجاح.",
              en: "Identity details saved successfully.",
            },
            lang,
          )}
        </div>
      )}
      {errorText && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-5 w-5" />
          {errorText}
        </div>
      )}

      <form
        action={saveIdentity}
        className="space-y-5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t({ ar: "الرقم القومي", en: "National ID number" }, lang)}
          </label>
          <input
            type="text"
            name="nationalId"
            inputMode="numeric"
            defaultValue={record?.nationalId ?? ""}
            placeholder={t({ ar: "14 رقم", en: "14 digits" }, lang)}
            required
            className="block w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <IdPhotoField
            name="front"
            label={t(
              { ar: "صورة البطاقة — الوجه الأمامي", en: "ID photo — front" },
              lang,
            )}
            current={record?.idPhotoFrontUrl ?? null}
            hint={t({ ar: "ارفع أو صوّر بالكاميرا", en: "Upload or use camera" }, lang)}
          />
          <IdPhotoField
            name="back"
            label={t(
              { ar: "صورة البطاقة — الوجه الخلفي", en: "ID photo — back" },
              lang,
            )}
            current={record?.idPhotoBackUrl ?? null}
            hint={t({ ar: "ارفع أو صوّر بالكاميرا", en: "Upload or use camera" }, lang)}
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Upload className="h-4 w-4" />
          {t({ ar: "حفظ بيانات الهوية", en: "Save identity details" }, lang)}
        </button>
        <p className="text-center text-xs text-slate-400">
          {t(
            {
              ar: "الحد الأقصى لكل صورة 2 ميجابايت (JPG أو PNG).",
              en: "Max 2 MB per image (JPG or PNG).",
            },
            lang,
          )}
        </p>
      </form>
    </div>
  )
}

function IdPhotoField({
  name,
  label,
  current,
  hint,
}: {
  name: string
  label: string
  current: string | null
  hint: string
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/10 bg-slate-50">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={label} className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-8 w-8 text-slate-300" />
        )}
      </div>
      <input
        type="file"
        name={name}
        accept="image/*"
        capture="environment"
        className="block w-full text-xs text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-600"
      />
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}
