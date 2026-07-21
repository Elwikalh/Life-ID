import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@life-id/ui"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"
import { prisma } from "@life-id/db"

export const dynamic = "force-dynamic"

const stats = [
  { label: "المرضى", value: "—" },
  { label: "الأطباء", value: "—" },
  { label: "الحجوزات", value: "—" },
  { label: "الإيرادات", value: "—" }
]

export default async function Dashboard() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status !== "approved") redirect("/pending")

  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || email || "مستخدم"

  await prisma.user.upsert({
    where: { id: user.id },
    update: { role: meta.role, fullName, email },
    create: { id: user.id, role: meta.role, fullName, email }
  })

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">
        لوحة التحكم ({ROLE_LABELS[meta.role]})
      </h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <NavLink href="/id" label="بطاقتي الطبية" />
        <NavLink href="/search" label="ابحث عن طبيب واحجز" />
        <NavLink href="/appointments" label="مواعيدي" />
        {meta.role === "super_admin" && <NavLink href="/admin" label="موافقات الحسابات" />}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 font-display text-3xl font-extrabold">{s.value}</div>
          </Card>
        ))}
      </div>
    </main>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:bg-brand-50"
    >
      {label}
    </Link>
  )
}
