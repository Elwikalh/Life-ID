"use client"

import { useTransition } from "react"
import type { Role } from "@life-id/types"
import { SELECTABLE_ROLES } from "../../lib/roles"

export function RolePicker({ onPick }: { onPick: (role: Role) => Promise<void> }) {
  const [pending, startTransition] = useTransition()

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-2xl font-extrabold">اختر نوع حسابك</h1>
      <p className="mt-2 text-slate-500">
        اختر الدور اللي بيوصفك، وهيتم مراجعته من الإدارة قبل تفعيل الحساب.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SELECTABLE_ROLES.map((r) => (
          <button
            key={r.value}
            disabled={pending}
            onClick={() => startTransition(() => onPick(r.value))}
            className="rounded-2xl border border-black/10 p-4 text-right transition hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50"
          >
            <div className="font-display font-bold">{r.labelAr}</div>
            <div className="mt-1 text-sm text-slate-500">{r.descAr}</div>
          </button>
        ))}
      </div>
      {pending && <p className="mt-6 text-sm text-slate-400">جاري الحفظ…</p>}
    </main>
  )
}
