import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { ArrowRight, Save } from "lucide-react"

export const dynamic = "force-dynamic"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export default async function EditMedicalIdPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const medId = await prisma.medicalId.findUnique({
    where: { userId: user.id },
  })
  if (!medId) redirect("/id")

  async function save(formData: FormData) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")

    const str = (k: string) => {
      const v = formData.get(k)
      return typeof v === "string" && v.trim() ? v.trim() : null
    }
    const list = (k: string) => {
      const v = formData.get(k)
      return typeof v === "string"
        ? v
            .split(/[,،\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    }

    await prisma.medicalId.update({
      where: { userId: u.id },
      data: {
        bloodType: str("bloodType"),
        allergies: list("allergies"),
        chronicConditions: list("chronicConditions"),
        medications: list("medications"),
        emergencyName: str("emergencyName"),
        emergencyPhone: str("emergencyPhone"),
      },
    })
    redirect("/id")
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">
          تعديل البيانات الطبية
        </h1>
        <Link
          href="/id"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
        >
          رجوع
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <form
        action={save}
        className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            فصيلة الدم
          </label>
          <select
            name="bloodType"
            defaultValue={medId.bloodType ?? ""}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
          >
            <option value="">— غير محدد —</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <TextArea
          name="allergies"
          label="الحساسية"
          defaultValue={medId.allergies.join("، ")}
          placeholder="مثال: بنسلين، مكسرات"
        />
        <TextArea
          name="chronicConditions"
          label="أمراض مزمنة"
          defaultValue={medId.chronicConditions.join("، ")}
          placeholder="مثال: سكري، ضغط"
        />
        <TextArea
          name="medications"
          label="أدوية حالية"
          defaultValue={medId.medications.join("، ")}
          placeholder="مثال: ميتفورمين 500"
        />

        <Field
          name="emergencyName"
          label="اسم شخص للطوارئ"
          defaultValue={medId.emergencyName ?? ""}
          placeholder="مثال: أحمد محمد"
        />
        <Field
          name="emergencyPhone"
          label="هاتف الطوارئ"
          defaultValue={medId.emergencyPhone ?? ""}
          placeholder="مثال: 01000000000"
        />

        <p className="text-xs text-slate-400">
          افصل بين كل عنصر بفاصلة أو سطر جديد.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Save className="h-4 w-4" />
            حفظ
          </button>
          <Link
            href="/id"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string
  label: string
  defaultValue: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
      />
    </div>
  )
}

function TextArea({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string
  label: string
  defaultValue: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-xl border border-black/10 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
      />
    </div>
  )
}
