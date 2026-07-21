import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../lib/roles"
import { ApproveButtons } from "./approve-buttons"

export default async function AdminPage() {
  const me = await currentUser()
  if (!me) redirect("/sign-in")
  const myMeta = me.publicMetadata as { role?: Role; status?: string }
  if (myMeta.role !== "super_admin") redirect("/dashboard")

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
      publicMetadata: { role: m.role, status: "approved" }
    })
    revalidatePath("/admin")
  }

  async function reject(userId: string) {
    "use server"
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: null, status: null }
    })
    revalidatePath("/admin")
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">موافقات الحسابات</h1>
      <p className="mt-2 text-slate-500">الحسابات المستنية موافقة ({pending.length})</p>
      <div className="mt-6 space-y-3">
        {pending.length === 0 && (
          <p className="text-slate-400">مفيش حسابات مستنية موافقة حاليًا.</p>
        )}
        {pending.map((u) => {
          const m = u.publicMetadata as { role?: Role }
          const email = u.emailAddresses?.[0]?.emailAddress ?? "—"
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || email
          return (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-2xl border border-black/10 p-4"
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
    </main>
  )
}
