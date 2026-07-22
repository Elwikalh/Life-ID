import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"

export const dynamic = "force-dynamic"

// الأدوار المتاحة للدخول التجريبي
const DEMO_ROLES: Role[] = [
  "super_admin",
  "doctor",
  "patient",
  "hospital",
  "clinic",
  "pharmacy",
  "lab",
  "radiology",
  "pharma_company",
  "medical_rep",
  "emergency",
]

export default async function DemoPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  // يضبط دور المستخدم الحالي ويدخله فورًا (معتمد)
  async function enterAs(role: Role) {
    "use server"
    const u = await currentUser()
    if (!u) redirect("/sign-in")
    const client = await clerkClient()
    await client.users.updateUserMetadata(u.id, {
      publicMetadata: { role, status: "approved" },
    })
    redirect(role === "super_admin" ? "/admin" : "/dashboard")
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold text-brand-700">
          الدخول التجريبي
        </h1>
        <p className="mt-2 text-slate-500">
          اختر أي دور للدخول فورًا ومعاينة تجربته. تقدر ترجع هنا وتبدّل في أي وقت.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DEMO_ROLES.map((role) => (
          <form key={role} action={enterAs.bind(null, role)}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-black/5 bg-white p-4 text-center font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {ROLE_LABELS[role]}
            </button>
          </form>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        وضع تجريبي للمعاينة — الأدوار غير المكتملة هتظهر بلوحة مبدئية لحد ما نكمّلها.
      </p>
    </main>
  )
}
