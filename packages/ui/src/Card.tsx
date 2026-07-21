import * as React from "react"

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:bg-slate-900 ${className}`}
      {...props}
    />
  )
}
