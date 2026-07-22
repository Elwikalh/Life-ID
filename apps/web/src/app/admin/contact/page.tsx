import { prisma } from "@life-id/db"
import { revalidatePath } from "next/cache"
import { Check } from "lucide-react"

export const dynamic = "force-dynamic"

type Msg = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  createdAt: Date
}

async function markRead(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  if (!id) return
  try {
    await prisma.contactMessage.update({ where: { id }, data: { read: true } })
  } catch {}
  revalidatePath("/admin/contact")
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function AdminContactPage() {
  let messages: Msg[] = []
  try {
    messages = (await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })) as Msg[]
  } catch {}
  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">تواصل معنا</h1>
        {unread > 0 ? (
          <span className="rounded-full bg-brand-500 px-3 py-1 text-sm font-semibold text-white">
            {unread} غير مقروءة
          </span>
        ) : null}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-slate-400 shadow-sm">
          لا توجد رسائل بعد
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                "rounded-2xl border p-4 shadow-sm " +
                (m.read ? "border-black/5 bg-white" : "border-brand-200 bg-brand-50/40")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    {!m.read ? <span className="h-2 w-2 rounded-full bg-brand-500" /> : null}
                  </div>
                  <div className="text-sm text-slate-400">{m.email}</div>
                </div>
                <div className="shrink-0 text-xs text-slate-400">{fmtDate(m.createdAt)}</div>
              </div>
              {m.subject ? (
                <div className="mt-2 text-sm font-medium text-slate-700">{m.subject}</div>
              ) : null}
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{m.message}</p>
              {!m.read ? (
                <form action={markRead} className="mt-3">
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Check className="h-3.5 w-3.5" /> تعليم كمقروءة
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
