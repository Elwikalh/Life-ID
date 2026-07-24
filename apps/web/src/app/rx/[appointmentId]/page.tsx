import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import type { ReactNode } from "react"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import { savePrescription } from "../../../lib/prescriptionActions"
import { t, type Lang } from "../../../lib/i18n"
import { getLang } from "../../../lib/serverLang"
import {
  ArrowLeft,
  Pill,
  Stethoscope,
  FlaskConical,
  ScanLine,
  AlertTriangle,
  Siren,
  FileText,
  CalendarClock,
  Save,
} from "lucide-react"

export const dynamic = "force-dynamic"

type RxItem = { drug: string; dosage?: string }
type OrderItem = { name: string; note?: string }
type Icon = typeof Pill

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

const TEXTAREA =
  "w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm leading-7 outline-none focus:border-brand-500"
const INPUT =
  "w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"

function FieldBlock({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: Icon
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon className="h-4 w-4 text-brand-500" />
        {label}
      </div>
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      {children}
    </div>
  )
}

function ReadBlock({
  icon: Icon,
  label,
  children,
  tone = "default",
}: {
  icon: Icon
  label: string
  children: ReactNode
  tone?: "default" | "danger" | "amber"
}) {
  const toneCls =
    tone === "danger"
      ? "border-danger/30 bg-danger/5"
      : tone === "amber"
        ? "border-amber-300/60 bg-amber-50"
        : "border-black/5 bg-white"
  const iconCls =
    tone === "danger"
      ? "text-danger"
      : tone === "amber"
        ? "text-amber-600"
        : "text-brand-500"
  return (
    <div className={"rounded-2xl border p-4 shadow-sm " + toneCls}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon className={"h-4 w-4 " + iconCls} />
        {label}
      </div>
      <div className="text-sm leading-7 text-slate-600">{children}</div>
    </div>
  )
}

function OrderList({ rows }: { rows: (RxItem | OrderItem)[] }) {
  return (
    <ul className="space-y-1.5">
      {rows.map((it, i) => {
        const title = "drug" in it ? it.drug : it.name
        const detail = "drug" in it ? it.dosage : it.note
        return (
          <li key={i} className="flex justify-between gap-3">
            <span className="font-medium text-slate-700">{title}</span>
            {detail ? <span className="text-slate-500">{detail}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}

export default async function RxPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role }
  const lang: Lang = await getLang(meta.role)
  const { appointmentId } = await params

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        select: {
          fullName: true,
          medicalId: {
            select: {
              bloodType: true,
              allergies: true,
              chronicConditions: true,
            },
          },
        },
      },
      provider: { select: { fullName: true } },
      prescription: true,
    },
  })
  if (!appt) notFound()

  const isProvider = appt.providerId === user.id
  const isPatient = appt.patientId === user.id
  if (!isProvider && !isPatient) notFound()

  const rx = appt.prescription
  const items = asArray<RxItem>(rx?.items)
  const labs = asArray<OrderItem>(rx?.labRequests)
  const imaging = asArray<OrderItem>(rx?.imagingRequests)

  const itemsText = items
    .map((i) => (i.dosage ? i.drug + " - " + i.dosage : i.drug))
    .join("\n")
  const labsText = labs
    .map((i) => (i.note ? i.name + " - " + i.note : i.name))
    .join("\n")
  const imagingText = imaging
    .map((i) => (i.note ? i.name + " - " + i.note : i.name))
    .join("\n")

  const med = appt.patient?.medicalId
  const allergies = med?.allergies ?? []
  const chronic = med?.chronicConditions ?? []
  const hasSummary =
    allergies.length > 0 || chronic.length > 0 || !!med?.bloodType

  const followUpValue = rx?.followUpAt
    ? new Date(rx.followUpAt).toISOString().slice(0, 10)
    : ""

  const pairHint = t(
    {
      ar: "سطر لكل عنصر — مثال: بنادول 500 - قرص كل 8 ساعات",
      en: "One per line — e.g. Panadol 500 - 1 tablet every 8h",
    },
    lang,
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={isProvider ? "/dashboard" : "/appointments"}
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {t({ ar: "رجوع", en: "Back" }, lang)}
      </Link>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-800">
              {t({ ar: "الكشف الطبي", en: "Clinical encounter" }, lang)}
            </h1>
            <div className="text-sm text-slate-400">
              {fmtDate(appt.scheduledAt)}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">
              {t({ ar: "المريض", en: "Patient" }, lang)}
            </div>
            <div className="font-medium text-slate-700">
              {appt.patient?.fullName ?? "—"}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-400">
              {t({ ar: "مقدم الخدمة", en: "Provider" }, lang)}
            </div>
            <div className="font-medium text-slate-700">
              {appt.provider?.fullName ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {hasSummary ? (
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            {t({ ar: "ملخص طبي للمريض", en: "Patient medical summary" }, lang)}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {med?.bloodType ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                {t({ ar: "فصيلة الدم", en: "Blood type" }, lang)}: {med.bloodType}
              </span>
            ) : null}
            {allergies.map((a, i) => (
              <span
                key={"al" + i}
                className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 font-medium text-danger"
              >
                <AlertTriangle className="h-3 w-3" />
                {t({ ar: "حساسية", en: "Allergy" }, lang)}: {a}
              </span>
            ))}
            {chronic.map((c, i) => (
              <span
                key={"ch" + i}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {isProvider ? (
        <form
          action={savePrescription}
          className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="appointmentId" value={appt.id} />

          <FieldBlock
            icon={Stethoscope}
            label={t({ ar: "التشخيص", en: "Diagnosis" }, lang)}
          >
            <input
              name="diagnosis"
              defaultValue={rx?.diagnosis ?? ""}
              className={INPUT}
              placeholder={t(
                {
                  ar: "التشخيص المبدئي أو النهائي",
                  en: "Working or final diagnosis",
                },
                lang,
              )}
            />
          </FieldBlock>

          <FieldBlock
            icon={Pill}
            label={t({ ar: "الروشتة الدوائية", en: "Medications" }, lang)}
            hint={pairHint}
          >
            <textarea
              name="items"
              defaultValue={itemsText}
              rows={6}
              className={TEXTAREA}
            />
          </FieldBlock>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldBlock
              icon={FlaskConical}
              label={t({ ar: "طلب تحاليل", en: "Lab tests requested" }, lang)}
              hint={pairHint}
            >
              <textarea
                name="labRequests"
                defaultValue={labsText}
                rows={4}
                className={TEXTAREA}
              />
            </FieldBlock>
            <FieldBlock
              icon={ScanLine}
              label={t({ ar: "طلب أشعة", en: "Imaging requested" }, lang)}
              hint={pairHint}
            >
              <textarea
                name="imagingRequests"
                defaultValue={imagingText}
                rows={4}
                className={TEXTAREA}
              />
            </FieldBlock>
          </div>

          <FieldBlock
            icon={AlertTriangle}
            label={t(
              { ar: "تنبيه حالة خطرة", en: "Critical / danger alert" },
              lang,
            )}
            hint={t(
              {
                ar: "أي حالة خطرة يجب الانتباه لها",
                en: "Any critical condition to be aware of",
              },
              lang,
            )}
          >
            <textarea
              name="dangerNote"
              defaultValue={rx?.dangerNote ?? ""}
              rows={2}
              className={TEXTAREA}
            />
          </FieldBlock>

          <FieldBlock
            icon={Siren}
            label={t(
              { ar: "تعليمات الطوارئ", en: "Emergency instructions" },
              lang,
            )}
            hint={t(
              {
                ar: "ماذا يفعل المريض أو يأخذ في حالة الطوارئ",
                en: "What the patient should do or take in an emergency",
              },
              lang,
            )}
          >
            <textarea
              name="emergencyPlan"
              defaultValue={rx?.emergencyPlan ?? ""}
              rows={3}
              className={TEXTAREA}
            />
          </FieldBlock>

          <FieldBlock
            icon={FileText}
            label={t({ ar: "ملاحظات إكلينيكية", en: "Clinical notes" }, lang)}
          >
            <textarea
              name="clinicalNotes"
              defaultValue={rx?.clinicalNotes ?? ""}
              rows={3}
              className={TEXTAREA}
            />
          </FieldBlock>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldBlock
              icon={CalendarClock}
              label={t({ ar: "موعد المتابعة", en: "Follow-up date" }, lang)}
            >
              <input
                type="date"
                name="followUpAt"
                defaultValue={followUpValue}
                className={INPUT}
              />
            </FieldBlock>
            <FieldBlock
              icon={FileText}
              label={t({ ar: "ملاحظة المتابعة", en: "Follow-up note" }, lang)}
            >
              <input
                name="followUpNote"
                defaultValue={rx?.followUpNote ?? ""}
                className={INPUT}
              />
            </FieldBlock>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
          >
            <Save className="h-5 w-5" />
            {t({ ar: "حفظ الكشف", en: "Save encounter" }, lang)}
          </button>
        </form>
      ) : !rx ? (
        <div className="rounded-2xl border border-black/5 bg-slate-50 p-6 text-center text-sm text-slate-400">
          {t(
            {
              ar: "لم يكتب الطبيب الكشف بعد.",
              en: "The doctor hasn't written the encounter yet.",
            },
            lang,
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rx.diagnosis ? (
            <ReadBlock
              icon={Stethoscope}
              label={t({ ar: "التشخيص", en: "Diagnosis" }, lang)}
            >
              {rx.diagnosis}
            </ReadBlock>
          ) : null}

          {items.length > 0 ? (
            <ReadBlock
              icon={Pill}
              label={t({ ar: "الأدوية", en: "Medications" }, lang)}
            >
              <OrderList rows={items} />
            </ReadBlock>
          ) : null}

          {labs.length > 0 ? (
            <ReadBlock
              icon={FlaskConical}
              label={t({ ar: "التحاليل المطلوبة", en: "Lab tests" }, lang)}
            >
              <OrderList rows={labs} />
            </ReadBlock>
          ) : null}

          {imaging.length > 0 ? (
            <ReadBlock
              icon={ScanLine}
              label={t({ ar: "الأشعة المطلوبة", en: "Imaging" }, lang)}
            >
              <OrderList rows={imaging} />
            </ReadBlock>
          ) : null}

          {rx.dangerNote ? (
            <ReadBlock
              icon={AlertTriangle}
              label={t({ ar: "تنبيه حالة خطرة", en: "Critical alert" }, lang)}
              tone="danger"
            >
              {rx.dangerNote}
            </ReadBlock>
          ) : null}

          {rx.emergencyPlan ? (
            <ReadBlock
              icon={Siren}
              label={t(
                { ar: "تعليمات الطوارئ", en: "Emergency instructions" },
                lang,
              )}
              tone="amber"
            >
              {rx.emergencyPlan}
            </ReadBlock>
          ) : null}

          {rx.clinicalNotes ? (
            <ReadBlock
              icon={FileText}
              label={t({ ar: "ملاحظات إكلينيكية", en: "Clinical notes" }, lang)}
            >
              {rx.clinicalNotes}
            </ReadBlock>
          ) : null}

          {rx.followUpAt || rx.followUpNote ? (
            <ReadBlock
              icon={CalendarClock}
              label={t({ ar: "المتابعة", en: "Follow-up" }, lang)}
            >
              {rx.followUpAt ? (
                <span className="font-medium text-slate-700">
                  {new Date(rx.followUpAt).toLocaleDateString("en-GB")}
                </span>
              ) : null}
              {rx.followUpNote ? (
                <div className="mt-1">{rx.followUpNote}</div>
              ) : null}
            </ReadBlock>
          ) : null}
        </div>
      )}
    </div>
  )
}
