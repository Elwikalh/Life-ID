"use client"

import { useState } from "react"
import type { PermissionGroup } from "../lib/permissions"
import { t, type Lang } from "../lib/i18n"

export default function PermissionsGrid({
  groups,
  selected = [],
  lang,
}: {
  groups: PermissionGroup[]
  selected?: string[]
  lang: Lang
}) {
  const allKeys = groups.flatMap((g) => g.permissions.map((p) => p.key))
  const [checked, setChecked] = useState<Set<string>>(new Set(selected))
  const allOn = allKeys.length > 0 && allKeys.every((k) => checked.has(k))

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAll() {
    setChecked(allOn ? new Set() : new Set(allKeys))
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
        <input
          type="checkbox"
          checked={allOn}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-black/20 text-brand-600"
        />
        {t({ ar: "تحديد الكل", en: "Select all" }, lang)}
      </label>

      {groups.map((group, gi) => (
        <div
          key={gi}
          className="rounded-xl border border-black/5 bg-white p-3 shadow-sm"
        >
          <div className="mb-2 text-sm font-semibold text-slate-700">
            {t(group.title, lang)}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.permissions.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.key}
                  checked={checked.has(p.key)}
                  onChange={() => toggle(p.key)}
                  className="h-4 w-4 rounded border-black/20 text-brand-600"
                />
                {t(p.label, lang)}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
