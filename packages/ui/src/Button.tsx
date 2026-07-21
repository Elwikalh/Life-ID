import * as React from "react"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline"
}

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-display text-sm font-semibold transition"
  const styles =
    variant === "primary"
      ? "bg-brand-500 text-white hover:bg-brand-600"
      : "border border-brand-500 text-brand-600 hover:bg-brand-50"
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
