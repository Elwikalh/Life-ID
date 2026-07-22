import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"
import { prisma } from "@life-id/db"
import { saveProfile } from "../../lib/profileActions"
import { PROVIDER_ROLES } from "../../lib/providers"
import { UserCircle, CheckCircle2, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const meta = u.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")

  const sp = await searchParams
  const saved = sp?.saved === "1"

  const email = u.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [u.firstName, u.lastName].filter(Boolean).join(" ") || email || "مستخدم"

  // اضمن وجود صف للمستخدم
  try {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, role: meta.role, fullName, email },
    })
  } catch {}

  let dbUser:
    | { specialty: string | null; bio: string | null; consultationFee: number | null }
    | null = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: u.id },
      select: { specialty: true, bio: true, consultationFee: true },
    })
  } catch {}

  const isProvider = PROVIDER_ROLES.includes(meta.role)

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowRight className="h-4 w-4" /> رجوع للوحة
      </Link>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-slate-800">{fullName}</div>
            <div className="text-sm text-slate-400">
              {ROLE_LABELS[meta.role]}
              {email ? " · " + email : ""}
            </div>
          </div>
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
            <CheckCircle2 className="h-4 w-4" /> تم حفظ البروفايل بنجاح
          </div>
        )}

        {isProvider ? (
          <form action={saveProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">التخصص</label>
              <input
                name="specialty"
                defaultValue={dbUser?.specialty ?? ""}
                placeholder="مثال: باطنة، أطفال، عظام..."
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">سعر الكشف (ج.م)</label>
              <input
                name="consultationFee"
                type="number"
                min="0"
                defaultValue={dbUser?.consultationFee ?? ""}
                placeholder="مثال: 250"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                لو سِبته فاضي، هيتحسب السعر الافتراضي (200 ج.م).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">نبذة</label>
              <textarea
                name="bio"
                defaultValue={dbUser?.bio ?? ""}
                rows={4}
                placeholder="نبذة قصيرة عنك تظهر للمريض عند الحجز"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm leading-7 outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
            >
              حفظ البروفايل
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl border border-black/5 bg-slate-50 p-6 text-center text-sm text-slate-500">
            بياناتك الأساسية بتتسجّل تلقائيًا. البروفايل التفصيلي متاح لمقدمي الخدمة.
          </div>
        )}
      </div>
    </main>
  )
}
