"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { UI, t, type Lang } from "../lib/i18n"

export default function NotificationBell({ lang }: { lang: Lang }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch("/api/notifications/count", {
          cache: "no-store",
        })
        if (!res.ok) return
        const data = (await res.json()) as { count?: number }
        if (active && typeof data.count === "number") setCount(data.count)
      } catch {}
    }
    load()
    const timer = setInterval(load, 60000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return (
    <Link
      href="/notifications"
      className="relative rounded-lg border border-black/10 p-2 text-slate-500 hover:text-slate-700"
      aria-label={t(UI.notifications, lang)}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}
