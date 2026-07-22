import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { AdminUserRow } from "../../../lib/adminUsers"

export default function UsersTable({
  rows,
  basePath,
}: {
  rows: AdminUserRow[]
  basePath: string
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-slate-50 text-slate-500">
            <th className="px-4 py-3 text-right font-medium">الاسم</th>
            <th className="px-4 py-3 text-right font-medium">البريد الإلكتروني</th>
            <th className="px-4 py-3 text-right font-medium">رقم الموبايل</th>
            <th className="px-4 py-3 text-right font-medium">تاريخ الانضمام</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                لا توجد بيانات
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-black/5 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 font-medium text-slate-700">{r.fullName}</td>
              <td className="px-4 py-3 text-slate-500">{r.email ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{r.phone ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(r.createdAt).toLocaleDateString("ar-EG")}
              </td>
              <td className="px-4 py-3 text-left">
                <Link
                  href={basePath + "/" + r.id}
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                >
                  عرض
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
