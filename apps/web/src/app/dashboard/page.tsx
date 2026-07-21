import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card } from "@life-id/ui"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">
        لوحة التحكم ({ROLE_LABELS[meta.role]})
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
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
