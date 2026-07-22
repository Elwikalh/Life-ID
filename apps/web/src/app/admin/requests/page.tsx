import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../../lib/roles"
import { ApproveButtons } from "../approve-buttons"

export const dynamic = "force-dynamic"

export default async function RequestsPage() {
  const client = await clerkClient()
  const list = await client.users.getUserList({ limit: 100 })

  const pending = list.data.filter((u) => {
    const m = u.publicMetadata as { role?: Role; status?: string }
    return m.role && m.status === "pending"
  })

  async function approve(userId: string) {
    "use server"
    const client = await clerkClient()
    const u = await client.users.getUser(userId)
    const m = u.publicMetadata as { role?: Role }
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: m.role, status: "approved" },
    })
    revalidatePath("/admin/requests")
  }

  async function reject(userId: string) {
    "use server"
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: null, status: null },
    })
    revalidatePath("/admin/requests")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold">طلبات الانضمام</h1>
        <p className="mt-1 text-slate-500">الحسابات المستنية موافقة ({pending.length})</p>
      </div>

      <div className="space-y-3">
        {pending.length === 0 && (
          <div className="rounded-2xl border border-black/5 bg-white p-6 text-center text-slate-400 shadow-sm">
            مفيش حسابات مستنية موافقة حاليًا.
          </div>
        )}
        {pending.map((u) => {
          const m = u.publicMetadata as { role?: Role }
          const email = u.emailAddresses?.[0]?.emailAddress ?? "—"
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || email
          return (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="font-display font-bold">{name}</div>
                <div className="text-sm text-slate-500">{email}</div>
                <div className="mt-1 text-sm text-brand-600">
                  الدور المطلوب: {m.role ? ROLE_LABELS[m.role] : "—"}
                </div>
              </div>
              <ApproveButtons userId={u.id} approve={approve} reject={reject} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
