"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useState } from "react"

export default function SearchBox({ placeholder }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get("q") ?? "")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? pathname + "?q=" + encodeURIComponent(q) : pathname)
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "بحث..."}
        className="w-full rounded-xl border border-black/10 bg-white py-2 pr-9 pl-3 text-sm outline-none focus:border-brand-400"
      />
    </form>
  )
}
