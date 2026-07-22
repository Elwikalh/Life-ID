import { getRecentActivities } from "../../../lib/activities"
import { ROLE_LABELS } from "../../../lib/roles"
import { UserPlus, CalendarPlus } from "lucide-react"

export const dynamic = "force-dynamic"

function fmtDate(d: Date) {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function ActivitiesPage() {
  const items = await getRecentActivities()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">النشاطات</h1>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        {items.length === 0 ? (
          <div className="py-10 text-center text-slate-400">لا توجد نشاطات بعد</div>
        ) : (
          <ol className="space-y-4">
            {items.map((it) => {
              const isSignup = it.kind === "signup"
              const Icon = isSignup ? UserPlus : CalendarPlus
              return (
                <li key={it.id} className="flex items-start gap-3">
                  <div
                    className={
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                      (isSignup
                        ? "bg-brand-50 text-brand-600"
                        : "bg-orange-50 text-orange-500")
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-700">{it.title}</span>
                      {it.role ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {ROLE_LABELS[it.role]}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-400">{it.subtitle}</div>
                  </div>
                  <div className="shrink-0 text-xs text-slate-400">{fmtDate(it.date)}</div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
