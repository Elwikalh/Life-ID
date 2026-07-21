"use client"

import { useTransition } from "react"

export function ApproveButtons({
  userId,
  approve,
  reject
}: {
  userId: string
  approve: (userId: string) => Promise<void>
  reject: (userId: string) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => approve(userId))}
        className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        موافقة
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => reject(userId))}
        className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        رفض
      </button>
    </div>
  )
}
