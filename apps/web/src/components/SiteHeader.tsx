"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HeartPulse,
  LayoutDashboard,
  Search,
  CalendarDays,
  QrCode,
  UserCircle,
  Pill,
  Inbox,
  ClipboardList,
} from "lucide-react"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs"

export default function SiteHeader() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()

  // Landing ("/") and the admin dashboard have their own chrome, so hide the app header there.
  if (pathname === "/" || pathname.startsWith("/admin")) return null

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role
  const isPatient = role === "patient"

  const navLinks = [
    { href: "/dashboard", label: "لوحتي", icon: LayoutDashboard, show: !!role },
    { href: "/search", label: "ابحث واحجز", icon: Search, show: isPatient },
    {
      href: "/appointments",
      label: "حجوزاتي",
      icon: CalendarDays,
      show: isPatient,
    },
    { href: "/id", label: "بطاقتي", icon: QrCode, show: isPatient },
    {
      href: "/my-prescriptions",
      label: "روشتاتي",
      icon: ClipboardList,
      show: isPatient,
    },
    {
      href: "/pharmacies",
      label: "صيدلياتي",
      icon: Pill,
      show: role === "doctor",
    },
    {
      href: "/pharmacy-inbox",
      label: "روشتات واردة",
      icon: Inbox,
      show: role === "pharmacy",
    },
    {
      href: "/profile",
      label: "بروفايلي",
      icon: UserCircle,
      show: !!role && !isPatient,
    },
  ].filter((l) => l.show)

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/5 bg-white/85 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link
          href={isSignedIn ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-display font-extrabold"
        >
          <HeartPulse className="h-6 w-6 text-brand-500" />
          Life ID
        </Link>
        {isSignedIn && navLinks.length > 0 && (
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + "/")
              const Icon = l.icon
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition " +
                    (active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              تسجيل الدخول
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  )
}
