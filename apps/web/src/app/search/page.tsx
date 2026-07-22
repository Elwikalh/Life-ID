import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { searchProviders, PROVIDER_ROLES } from "../../lib/providers"
import { ROLE_LABELS } from "../../lib/roles"
import { Search, CalendarPlus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const sp = await searchParams
  const q = sp?.q ?? ""
  const role = sp?.role ?? ""
  const providers = await searchProviders(q, role)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">ابحث واحجز</h1>
      <p className="text-sm text-slate-500">اختر مقدم الخدمة واحجز موعدك بسهولة.</p>

      <form className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم..."
            className="w-full rounded-xl border border-black/10 py-2.5 pr-9 pl-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        {role ? <input type="hidden" name="role" value={role} /> : null}
        <button className="rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600">
          بحث
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/search"
          className={
            "rounded-full px-3 py-1 text-sm " +
            (!role
              ? "bg-brand-500 text-white"
              : "border border-black/10 text-slate-600 hover:bg-slate-50")
          }
        >
          الكل
        </Link>
        {PROVIDER_ROLES.map((r) => (
          <Link
            key={r}
            href={"/search?role=" + r}
            className={
              "rounded-full px-3 py-1 text-sm " +
              (role === r
                ? "bg-brand-500 text-white"
                : "border border-black/10 text-slate-600 hover:bg-slate-50")
            }
          >
            {ROLE_LABELS[r]}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {providers.length === 0 && (
          <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-slate-400 shadow-sm">
            لا يوجد مقدمو خدمة مطابقون. جرّب بحثًا آخر.
          </div>
        )}
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 font-display font-bold text-brand-600">
                {p.fullName.slice(0, 1)}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{p.fullName}</div>
                <div className="text-xs text-slate-400">{ROLE_LABELS[p.role]}</div>
              </div>
            </div>
            <Link
              href={"/book/" + p.id}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <CalendarPlus className="h-4 w-4" /> احجز
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
