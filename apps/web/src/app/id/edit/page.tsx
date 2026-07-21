import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

export const dynamic = "force-dynamic"

export default async function EditMedicalIdPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const medId = await prisma.medicalId.findUnique({ where: { userId: user.id } })
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
        ? v.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
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
        emergencyPhone: str("emergencyPhone")
      }
    })
    redirect("/id")
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">تعديل البيانات الطبية</h1>
      <form action={save} className="mt-6 space-y-4">
        <Field name="bloodType" label="فصيلة الدم" defaultValue={medId.bloodType ?? ""} placeholder="مثال: O+" />
        <Field name="allergies" label="الحساسية (افصل بينهم بفاصلة)" defaultValue={medId.allergies.join("، ")} placeholder="بنسلين، مكسرات" />
        <Field name="chronicConditions" label="أمراض مزمنة (افصل بفاصلة)" defaultValue={medId.chronicConditions.join("، ")} placeholder="سكر، ضغط" />
        <Field name="medications" label="أدوية حالية (افصل بفاصلة)" defaultValue={medId.medications.join("، ")} placeholder="أنسولين" />
        <Field name="emergencyName" label="اسم شخص للطوارئ" defaultValue={medId.emergencyName ?? ""} placeholder="الاسم" />
        <Field name="emergencyPhone" label="رقم الطوارئ" defaultValue={medId.emergencyPhone ?? ""} placeholder="01xxxxxxxxx" />
        <div className="flex gap-3">
          <button type="submit" className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">حفظ</button>
          <a href="/id" className="rounded-xl border border-black/10 px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-50">رجوع</a>
        </div>
      </form>
    </main>
  )
}

function Field({
  name,
  label,
  defaultValue,
  placeholder
}: {
  name: string
  label: string
  defaultValue: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-brand-500"
      />
    </label>
  )
}
