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
  FlaskConical,
  Radiation,
  Building2,
  Stethoscope,
} from "lucide-react"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs"
import { ROLE_LABELS, UI, t, type Bi, type Lang } from "../lib/i18n"

type NavItem = {
  href: string
  label: Bi
  icon: typeof LayoutDashboard
  noActive?: boolean
}

const BARE_PREFIXES = ["/sign-in", "/sign-up", "/onboarding", "/pending", "/admin"]

function navForRole(role?: string): NavItem[] {
  const dashboard: NavItem = {
    href: "/dashboard",
    label: { ar: "لوحتي", en: "Dashboard" },
    icon: LayoutDashboard,
  }
  const negotiations: NavItem = {
    href: "/negotiations",
    label: { ar: "التفاوض", en: "Negotiations" },
    icon: Handshake,
  }
  const commissions: NavItem = {
    href: "/profile/commissions",
    label: { ar: "العمولات", en: "Commissions" },
    icon: Calculator,
  }
  const profile: NavItem = {
    href: "/profile",
    label: { ar: "بروفايلي", en: "My Profile" },
    icon: UserCircle,
  }

  if (!role) return [dashboard]

  if (role === "patient") {
    return [
      dashboard,
      { href: "/search", label: { ar: "بحث وحجز", en: "Find & Book" }, icon: Search },
      { href: "/appointments", label: { ar: "حجوزاتي", en: "Appointments" }, icon: CalendarDays },
      { href: "/id", label: { ar: "بطاقتي الطبية", en: "Medical ID" }, icon: QrCode },
      { href: "/my-prescriptions", label: { ar: "روشتاتي", en: "Prescriptions" }, icon: ClipboardList },
      { href: "/reviews", label: { ar: "تقييماتي", en: "Reviews" }, icon: Star },
    ]
  }

  if (role === "pharma_company") {
    return [
      dashboard,
      { href: "/profile/products", label: { ar: "المنتجات", en: "Products" }, icon: Package },
      { href: "/profile/reps", label: { ar: "المندوبين", en: "Reps" }, icon: Users },
      { href: "/profile/partnerships", label: { ar: "الشراكات", en: "Partnerships" }, icon: Handshake },
      { href: "/profile/invitations", label: { ar: "الدعوات", en: "Invitations" }, icon: Inbox },
      commissions,
      profile,
    ]
  }

  if (role === "medical_rep") {
    return [
      dashboard,
      { href: "/rep", label: { ar: "زياراتي", en: "My Visits" }, icon: MapPin },
      negotiations,
      commissions,
      profile,
    ]
  }

  if (role === "doctor") {
    return [
      dashboard,
      { href: "/pharmacies", label: { ar: "صيدلياتي", en: "Pharmacies" }, icon: Pill },
      { href: "/search?role=lab", label: { ar: "المعامل", en: "Laboratories" }, icon: FlaskConical, noActive: true },
      { href: "/search?role=radiology", label: { ar: "مراكز الأشعة", en: "Radiology" }, icon: Radiation, noActive: true },
      { href: "/search?role=hospital", label: { ar: "المستشفيات", en: "Hospitals" }, icon: Building2, noActive: true },
      { href: "/search?role=clinic", label: { ar: "العيادات", en: "Clinics" }, icon: Stethoscope, noActive: true },
      negotiations,
      commissions,
      profile,
    ]
  }

  if (role === "pharmacy") {
    return [
      dashboard,
      { href: "/pharmacy-inbox", label: { ar: "روشتات واردة", en: "Incoming Rx" }, icon: Inbox },
      negotiations,
      commissions,
      profile,
    ]
  }

  // عيادة / مستشفى / معمل / أشعة / طوارئ
  return [
    dashboard,
    { href: "/search", label: { ar: "الشبكة الطبية", en: "Medical Network" }, icon: Search },
    negotiations,
    commissions,
    profile,
  ]
}

function LangToggle({ lang }: { lang: Lang }) {
  function change(next: Lang) {
    if (next === lang) return
    document.cookie = `lang=${next}; path=/; max-age=31536000`
    window.location.reload()
  }
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-black/10 text-xs">
      {(["en", "ar"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          className={
            "px-2 py-1 font-semibold uppercase " +
            (lang === l ? "bg-brand-500 text-white" : "text-slate-500")
          }
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export default function AppShell({
  lang,
  children,
}: {
  lang: Lang
  children: React.ReactNode
}) {
  const pathname = usePathname() || "/"
  const { isLoaded, isSignedIn, user } = useUser()
  const [open, setOpen] = useState(false)

  const isBare =
    pathname === "/" || BARE_PREFIXES.some((p) => pathname.startsWith(p))

  if (isBare || !isLoaded || !isSignedIn) {
    return <>{children}</>
  }

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role
  const roleLabel = role && ROLE_LABELS[role] ? t(ROLE_LABELS[role], lang) : ""
  const items = navForRole(role)

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    t(UI.user, lang)

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4 font-display text-lg font-extrabold text-slate-800">
        <HeartPulse className="h-6 w-6 text-brand-500" />
        Life ID
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            !item.noActive &&
            (pathname === item.href || pathname.startsWith(item.href + "/"))
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
              {t(item.label, lang)}
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-black/5 bg-white lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-64 border-e border-black/5 bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-black/10 p-2 text-slate-600 lg:hidden"
            aria-label={t(UI.openMenu, lang)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400 sm:max-w-md">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t(UI.searchPlaceholder, lang)}</span>
          </div>

          <div className="flex items-center gap-3">
            <LangToggle lang={lang} />
            <button
              type="button"
              className="rounded-lg border border-black/10 p-2 text-slate-500 hover:text-slate-700"
              aria-label={t(UI.notifications, lang)}
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden text-end leading-tight sm:block">
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
                  {t(UI.signIn, lang)}
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
