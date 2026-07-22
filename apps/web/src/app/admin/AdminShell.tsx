"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  HeartPulse,
  Bell,
  LayoutDashboard,
  Inbox,
  Users,
  Stethoscope,
  Building,
  Building2,
  Pill,
  FlaskConical,
  Scan,
  Factory,
  UserRound,
  Handshake,
  ShieldCheck,
  Wallet,
  Settings,
  Activity,
  Headphones,
} from "lucide-react"

type Item = { label: string; icon: typeof LayoutDashboard; href?: string }

const items: Item[] = [
  { label: "لوحة التحكم", icon: LayoutDashboard, href: "/admin" },
  { label: "الطلبات", icon: Inbox, href: "/admin/requests" },
  { label: "المرضى", icon: Users },
  { label: "الأطباء", icon: Stethoscope },
  { label: "المستشفيات", icon: Building },
  { label: "العيادات", icon: Building2 },
  { label: "الصيدليات", icon: Pill },
  { label: "المعامل", icon: FlaskConical },
  { label: "مراكز الأشعة", icon: Scan },
  { label: "شركات الأدوية", icon: Factory },
  { label: "المندوبين", icon: UserRound },
  { label: "الشركاء", icon: Handshake },
  { label: "المديرين", icon: ShieldCheck },
  { label: "المالية", icon: Wallet },
  { label: "الإدارة", icon: Settings },
  { label: "النشاطات", icon: Activity },
  { label: "تواصل معنا", icon: Headphones },
]

export default function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode
  userName: string
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-black/5 bg-white lg:flex">
        <div className="flex items-center gap-2 px-6 py-5 font-display text-lg font-extrabold">
          <HeartPulse className="h-6 w-6 text-brand-500" />
          Life <span className="text-brand-500">ID</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {items.map((it) => {
            const active = it.href && pathname === it.href
            const Icon = it.icon
            const base =
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition"
            if (!it.href) {
              return (
                <div
                  key={it.label}
                  className={base + " cursor-default text-slate-400"}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{it.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                    قريبًا
                  </span>
                </div>
              )
            }
            return (
              <Link
                key={it.label}
                href={it.href}
                className={
                  base +
                  (active
                    ? " bg-brand-500 text-white shadow-sm"
                    : " text-slate-600 hover:bg-brand-50 hover:text-brand-700")
                }
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-3">
          <div className="lg:hidden flex items-center gap-2 font-display font-extrabold">
            <HeartPulse className="h-5 w-5 text-brand-500" /> Life ID
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-semibold leading-tight">{userName}</div>
                <div className="text-xs text-slate-400">مدير النظام</div>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
