import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { ROLE_LABELS } from "../../lib/roles"
import type { Role } from "@life-id/types"

export const dynamic = "force-dynamic"

const PROVIDER_ROLES: Role[] = ["doctor", "clinic", "hospital"]

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const { q } = await searchParams
  const term = (q ?? "").trim()

  const providers = await prisma.user.findMany({
    where: {
      role: { in: PROVIDER_ROLES },
      ...(term ? { fullName: { contains: term, mode: "insensitive" } } : {})
    },
    orderBy: { fullName: "asc" },
    take: 50
  })

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-extrabold">ابحث عن طبيب واحجز</h1>
      <form className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={term}
          placeholder="ابحث بالاسم..."
          className="flex-1 rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-brand-500"
        />
        <button className="rounded-xl bg-brand-500 px-5 py-2 font-semibold text-white hover:bg-brand-600">بحث</button>
      </form>

      <div className="mt-6 space-y-3">
        {providers.length === 0 && (
          <p className="text-slate-400">مفيش نتائج{term ? ` لـ "${term}"` : ""}.</p>
        )}
        {providers.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl border border-black/10 p-4">
            <div>
              <div className="font-display font-bold">{p.fullName}</div>
              <div className="text-sm text-brand-600">{ROLE_LABELS[p.role]}</div>
            </div>
            <Link
              href={`/book/${p.id}`}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              احجز
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
