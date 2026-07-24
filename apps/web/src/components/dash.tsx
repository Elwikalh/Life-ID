import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

// ألوان المؤشرات — كل لون باسمه الكامل عشان Tailwind يشوفه
type Tone = "brand" | "sky" | "amber" | "emerald" | "violet" | "danger"

const CHIP: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  danger: "bg-danger/10 text-danger",
}

export function PageIntro({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-slate-800">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}

// هيدر احترافي موحّد لكل الأدوار
export function DashHeader({
  name,
  roleLabel,
  icon: Icon,
}: {
  name: string
  roleLabel: string
  icon: LucideIcon
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 p-6 text-white shadow-sm">
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90">
            {roleLabel}
          </span>
          <h1 className="mt-1 truncate font-display text-2xl font-extrabold">
            أهلاً، {name}
          </h1>
        </div>
      </div>
      <div className="pointer-events-none absolute -start-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 start-28 h-32 w-32 rounded-full bg-white/5" />
    </div>
  )
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  hint,
  tone = "brand",
}: {
  icon: LucideIcon
  label: string
  value: string | number
  href?: string
  hint?: string
  tone?: Tone
}) {
  const inner = (
    <div className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div
          className={
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
            CHIP[tone]
          }
        >
          <Icon className="h-6 w-6" />
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-2xl font-extrabold text-slate-800">
          {value}
        </div>
        <div className="mt-0.5 truncate text-sm text-slate-500">{label}</div>
        {hint ? (
          <div className="mt-1 truncate text-xs text-slate-400">{hint}</div>
        ) : null}
      </div>
    </div>
  )
  if (href)
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  return inner
}

export function SectionCard({
  title,
  icon: Icon,
  actionHref,
  actionLabel,
  children,
}: {
  title: string
  icon?: LucideIcon
  actionHref?: string
  actionLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display font-bold text-slate-800">
          {Icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          {title}
        </h2>
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {actionLabel}
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  ctaHref,
  ctaLabel,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  ctaHref?: string
  ctaLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-slate-50/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" />
      </div>
      <div className="font-medium text-slate-700">{title}</div>
      {hint && (
        <div className="mt-1 max-w-sm text-sm text-slate-400">{hint}</div>
      )}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}

export function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: LucideIcon
  label: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700 hover:shadow-md"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </Link>
  )
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "brand" | "amber" | "sky" | "emerald" | "danger"
}) {
  const cls = {
    neutral: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    emerald: "bg-emerald-100 text-emerald-700",
    danger: "bg-danger/10 text-danger",
  }[tone]
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
        cls
      }
    >
      {children}
    </span>
  )
}
