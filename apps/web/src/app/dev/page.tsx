import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@life-id/db"
import { SELECTABLE_ROLES } from "../../lib/roles"
import type { Role } from "@life-id/types"

export const dynamic = "force-dynamic"

const DEMO_PROVIDERS: { email: string; fullName: string; role: Role }[] = [
  { email: "doc.hany@demo.local", fullName: "د. هاني عبدالله - باطنة", role: "doctor" },
  { email: "doc.mona@demo.local", fullName: "د. منى صلاح - أطفال", role: "doctor" },
  { email: "doc.tarek@demo.local", fullName: "د. طارق فؤاد - عظام", role: "doctor" },
  { email: "clinic.shifa@demo.local", fullName: "عيادات الشفاء", role: "clinic" },
  { email: "hosp.salam@demo.local", fullName: "مستشفى السلام الدولي", role: "hospital" }
]

export default async function DevPage() {
  if (process.env.DEV_TOOLS !== "1") notFound()

  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }

  async function setRole(role: Role) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")
    const client = await clerkClient()
    await client.users.updateUserMetadata(u.id, {
      publicMetadata: { role, status: "approved" }
    })
    revalidatePath("/dev")
    redirect("/dashboard")
  }

  async function seedProviders() {
    "use server"
    for (const p of DEMO_PROVIDERS) {
      await prisma.user.upsert({
        where: { email: p.email },
        update: { fullName: p.fullName, role: p.role },
        create: { email: p.email, fullName: p.fullName, role: p.role }
      })
    }
    revalidatePath("/dev")
    redirect("/search")
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">أدوات التجربة 🧪</h1>
      <p className="mt-2 text-sm text-slate-500">
        للتطوير والتجربة فقط — بنقفلها قبل الإطلاق. دورك الحالي: <b>{meta.role ?? "—"}</b>
      </p>

      <h2 className="mt-8 font-display text-lg font-bold">بدّل دورك بسرعة</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SELECTABLE_ROLES.map((r) => (
          <form key={r.value} action={setRole.bind(null, r.value)}>
            <button className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm hover:border-brand-500 hover:bg-brand-50">
              {r.labelAr}
            </button>
          </form>
        ))}
        <form action={setRole.bind(null, "super_admin" as Role)}>
          <button className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm hover:border-brand-500 hover:bg-brand-50">
            مدير النظام
          </button>
        </form>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">بيانات تجريبية</h2>
      <p className="mt-1 text-sm text-slate-500">يضيف أطباء وعيادات ومستشفى تقدر تحجز عندهم علطول.</p>
      <form action={seedProviders} className="mt-3">
        <button className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
          زرع أطباء/عيادات تجريبية
        </button>
      </form>
    </main>
  )
}
