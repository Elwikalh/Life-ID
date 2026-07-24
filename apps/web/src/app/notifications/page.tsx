import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { markAllNotificationsRead } from "../../lib/notificationActions"
import { Bell, ArrowRight, CheckCheck } from "lucide-react"

export const dynamic = "force-dynamic"

const fmt = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default async function NotificationsPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للوحة
      </Link>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
            <Bell className="h-5 w-5 text-brand-500" />
            الإشعارات
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread > 0
              ? `عندك ${unread} إشعار غير مقروء`
              : "مفيش إشعارات جديدة"}
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <CheckCheck className="h-4 w-4" />
              تحديد الكل كمقروء
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          لا توجد إشعارات.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const inner = (
              <div
                className={
                  "rounded-2xl border p-4 shadow-sm transition " +
                  (n.read
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-brand-50")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-800">
                    {n.title}
                  </div>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  )}
                </div>
                {n.body && (
                  <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                )}
                <div className="mt-2 text-xs text-slate-400">
                  {fmt.format(n.createdAt)}
                </div>
              </div>
            )
            return n.href ? (
              <Link key={n.id} href={n.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
