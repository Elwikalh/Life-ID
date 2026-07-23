import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"

export const dynamic = "force-dynamic"

export default async function PendingPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const meta = user.publicMetadata as { role?: Role; status?: string }
  if (!meta.role) redirect("/onboarding")
  if (meta.status === "approved") redirect("/dashboard")

  const suspended = meta.status === "suspended"

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mb-4 text-5xl">{suspended ? "🚫" : "⏳"}</div>
      <h1 className="font-display text-2xl font-extrabold">
        {suspended ? "تم تعليق حسابك" : "حسابك تحت المراجعة"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        الدور المختار: {ROLE_LABELS[meta.role]}
      </p>
      <p className="mt-4 text-sm text-slate-600">
        {suspended
          ? "تم تعليق حسابك بواسطة الإدارة. لو تعتقد إن ده حصل بالخطأ، تواصل مع الدعم."
          : "هيتم تفعيل حسابك بعد موافقة الإدارة. تقدر تعمل تحديث للصفحة بعد شوية."}
      </p>
    </div>
  )
}
