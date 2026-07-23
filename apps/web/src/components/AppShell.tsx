"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  HeartPulse,
  LayoutDashboard,
  Search,
  CalendarDays,
  QrCode,
  ClipboardList,
  Star,
  Pill,
  Inbox,
  Handshake,
  Calculator,
  UserCircle,
  Package,
  Users,
  MapPin,
  Bell,
  Menu,
} from "lucide-react"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs"

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard }

const ROLE_LABELS: Record<string, string> = {
  patient: "مريض",
  doctor: "طبيب",
  clinic: "عيادة",
  pharmacy: "صيدلية",
  lab: "معمل تحاليل",
  radiology: "مركز أشعة",
  hospital: "مستشفى",
  pharma_company: "شركة أدوية",
  medical_rep: "مندوب دعاية طبية",
  emergency: "طوارئ",
  super_admin: "مدير النظام",
}

// صفحات لها إطارها الخاص فلا تظهر القائمة الجانبية فيها
const BARE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/pending",
  "/admin",
]

function navForRole(role?: string): NavItem[] {
  const dashboard: NavItem = {
    href: "/dashboard",
    label: "لوحتي",
    icon: LayoutDashboard,
  }
  const negotiations: NavItem = {
    href: "/negotiations",
    label: "التفاوض",
    icon: Handshake,
  }
  const commissions: NavItem = {
    href: "/profile/commissions",
    label: "العمولات",
    icon: Calculator,
  }
  const profile: NavItem = {
    href: "/profile",
    label: "بروفايلي",
    icon: UserCircle,
  }

  if (!role) return [dashboard]

  if (role === "patient") {
    return [
      dashboard,
      { href: "/search", label: "بحث وحجز", icon: Search },
      { href: "/appointments", label: "حجوزاتي", icon: CalendarDays },
      { href: "/id", label: "بطاقتي الطبية", icon: QrCode },
      { href: "/my-prescriptions", label: "روشتاتي", icon: ClipboardList },
      { href: "/reviews", label: "تقييماتي", icon: Star },
    ]
  }

  if (role === "pharma_company") {
    return [
      dashboard,
      { href: "/profile/products", label: "المنتجات", icon: Package },
      { href: "/profile/reps", label: "المندوبين", icon: Users },
      { href: "/profile/partnerships", label: "الشراكات", icon: Handshake },
      { href: "/profile/invitations", label: "الدعوات", icon: Inbox },
      commissions,
      profile,
    ]
  }

  if (role === "medical_rep") {
    return [
      dashboard,
      { href: "/rep", label: "زياراتي", icon: MapPin },
      negotiations,
      commissions,
      profile,
    ]
  }

  // باقي مقدمي الخدمة: طبيب / عيادة / مستشفى / معمل / أشعة / طوارئ
  const items: NavItem[] = [dashboard]
  if (role === "doctor")
    items.push({ href: "/pharmacies", label: "صيدلياتي", icon: Pill })
  if (role === "pharmacy")
    items.push({ href: "/pharmacy-inbox", label: "روشتات واردة", icon: Inbox })
  items.push(negotiations, commissions, profile)
  return items
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const { isLoaded, isSignedIn, user } = useUser()
  const [open, setOpen] = useState(false)

  const isBare =
    pathname === "/" || BARE_PREFIXES.some((p) => pathname.startsWith(p))

  // الصفحة التعريفية وصفحات الدخول ولوحة الأدمن تحتفظ بإطارها الخاص
  if (isBare || !isLoaded || !isSignedIn) {
    return <>{children}</>
  }

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role
  const roleLabel = role ? (ROLE_LABELS[role] ?? "") : ""
  const items = navForRole(role)

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "مستخدم"

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4 font-display text-lg font-extrabold text-slate-800">
        <HeartPulse className="h-6 w-6 text-brand-500" />
        Life ID
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                (active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-black/5 px-5 py-3 text-xs text-slate-400">
        © Life ID
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* القائمة الجانبية — شاشات سطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-black/5 bg-white lg:block">
        {sidebar}
      </aside>

      {/* القائمة الجانبية — الموبايل (درج منزلق) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 w-64 border-l border-black/5 bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* العمود الرئيسي */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-black/10 p-2 text-slate-600 lg:hidden"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400 sm:max-w-md">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">ابحث في Life ID…</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-black/10 p-2 text-slate-500 hover:text-slate-700"
              aria-label="الإشعارات"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold text-slate-700">
                {fullName}
              </div>
              {roleLabel && (
                <div className="text-xs text-slate-400">{roleLabel}</div>
              )}
            </div>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                  تسجيل الدخول
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        {/* المحتوى */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
