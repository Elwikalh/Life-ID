import Link from "next/link"
import type { LucideIcon } from "lucide-react"

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

export function KpiCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  href?: string
}) {
  const inner = (
    <div className="flex h-full items-center gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm text-slate-500">{label}</div>
        <div className="truncate font-display text-2xl font-extrabold text-slate-800">
          {value}
        </div>
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
  actionHref,
  actionLabel,
  children,
}: {
  title: string
  actionHref?: string
  actionLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-slate-800">{title}</h2>
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {actionLabel}
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-slate-50/50 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-medium text-slate-700">{title}</div>
      {hint && <div className="mt-1 text-sm text-slate-400">{hint}</div>}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
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
      className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
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
  tone?: "neutral" | "brand" | "amber" | "sky" | "danger"
}) {
  const cls = {
    neutral: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    danger: "bg-danger/10 text-danger",
  }[tone]
  return (
    <span
      className={
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium " + cls
      }
    >
      {children}
    </span>
  )
}
