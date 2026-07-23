"use client"

import { useState } from "react"
import { Shield, Ban, CheckCircle2, Save } from "lucide-react"
import type { Role } from "@life-id/types"
import { ROLE_LABELS } from "../../../../lib/roles"
import { changeUserRole, setUserStatus } from "../../../../lib/adminActions"

const ROLES: Role[] = [
  "patient",
  "doctor",
  "clinic",
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
  "medical_rep",
  "emergency",
  "super_admin",
]

export default function UserActions({
  userId,
  section,
  role,
  status,
  isSelf,
}: {
  userId: string
  section: string
  role: Role
  status: string
  isSelf: boolean
}) {
  const [selected, setSelected] = useState<Role>(role)
  const suspended = status === "suspended"
  const approved = status === "approved"

  if (isSelf) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2 font-display font-bold">
          <Shield className="h-5 w-5 text-brand-600" /> إدارة الحساب
        </div>
        <p className="text-sm text-slate-500">
          ده حسابك أنت — مش هتقدر تغيّر دورك أو تعلّق نفسك من هنا حفاظًا على
          أمان اللوحة.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 font-display font-bold">
        <Shield className="h-5 w-5 text-brand-600" /> إدارة الحساب
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* تغيير الدور */}
        <form action={changeUserRole} className="space-y-2">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="section" value={section} />
          <label className="block text-xs text-slate-400">دور المستخدم</label>
          <select
            name="role"
            value={selected}
            onChange={(e) => setSelected(e.target.value as Role)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={selected === role}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> حفظ الدور
          </button>
        </form>

        {/* حالة الحساب */}
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-400">حالة الحساب</div>
            <span
              className={
                "mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium " +
                (suspended
                  ? "bg-danger/10 text-danger"
                  : approved
                    ? "bg-brand-50 text-brand-700"
                    : "bg-amber-100 text-amber-700")
              }
            >
              {suspended ? "معلّق" : approved ? "مفعّل" : "قيد المراجعة"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {!approved && (
              <form action={setUserStatus}>
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="section" value={section} />
                <input type="hidden" name="status" value="approved" />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  <CheckCircle2 className="h-4 w-4" /> تفعيل الحساب
                </button>
              </form>
            )}
            {!suspended && (
              <form action={setUserStatus}>
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="section" value={section} />
                <input type="hidden" name="status" value="suspended" />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (
                      !confirm(
                        "تعليق الحساب هيمنع المستخدم من الدخول للوحة والداشبورد. تأكيد؟",
                      )
                    )
                      e.preventDefault()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
                >
                  <Ban className="h-4 w-4" /> تعليق الحساب
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
