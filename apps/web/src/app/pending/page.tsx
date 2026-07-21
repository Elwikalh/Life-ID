import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"

export default async function PendingPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status === "approved") redirect("/dashboard")

  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">حسابك تحت المراجعة ⏳</h1>
      <p className="mt-3 text-slate-500">
        اخترت الدور: <b className="text-slate-700">{ROLE_LABELS[meta.role]}</b>
      </p>
      <p className="mt-1 text-slate-500">
        هيتم تفعيل حسابك بعد موافقة الإدارة. تقدر تعمل تحديث للصفحة بعد شوية.
      </p>
    </main>
  )
}
