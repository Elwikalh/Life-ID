"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"

const LABELS: Record<string, string> = {
  demo: "الدخول التجريبي",
  dashboard: "لوحتي",
  onboarding: "اختيار الدور",
  pending: "في انتظار الموافقة",
  id: "الهوية الطبية",
  edit: "تعديل",
  search: "بحث",
  book: "حجز",
  appointments: "الحجوزات",
  "db-check": "فحص قاعدة البيانات",
  dev: "أدوات المطور",
  "sign-in": "تسجيل الدخول",
  "sign-up": "إنشاء حساب",
  admin: "لوحة التحكم",
  requests: "الطلبات",
  patients: "المرضى",
  doctors: "الأطباء",
  hospitals: "المستشفيات",
  clinics: "العيادات",
  pharmacies: "الصيدليات",
  laboratories: "المعامل",
  radiologies: "مراكز الأشعة",
  "pharma-companies": "شركات الأدوية",
  representatives: "المندوبين",
  admins: "المديرين",
}

export default function Breadcrumbs({
  insideAdmin = false,
}: {
  insideAdmin?: boolean
}) {
  const pathname = usePathname()
  if (!pathname || pathname === "/") return null
  if (!insideAdmin && pathname.startsWith("/admin")) return null
  if (!insideAdmin && pathname.startsWith("/e/")) return null

  const segments = pathname.split("/").filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = LABELS[seg] ?? "التفاصيل"
    return { href, label }
  })

  const wrapper = insideAdmin
    ? "flex items-center gap-1 text-sm text-slate-500"
    : "flex items-center gap-1 px-6 pt-4 text-sm text-slate-500"

  return (
    <nav aria-label="مسار التنقل" className={wrapper}>
      {!insideAdmin && (
        <>
          <Link href="/" className="transition hover:text-brand-600">
            الرئيسية
          </Link>
          {crumbs.length > 0 && (
            <ChevronLeft className="h-4 w-4 text-slate-300" />
          )}
        </>
      )}
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          {i > 0 && <ChevronLeft className="h-4 w-4 text-slate-300" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-slate-700">{c.label}</span>
          ) : (
            <Link href={c.href} className="transition hover:text-brand-600">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
