"use client"

import { useState } from "react"
import { Copy, Check, Printer, Download } from "lucide-react"

export function IdActions({
  emergencyUrl,
  qrImg,
}: {
  emergencyUrl: string
  qrImg: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(emergencyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const btn =
    "flex flex-col items-center gap-1 rounded-xl border border-black/10 bg-white px-2 py-3 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-600"

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <button type="button" onClick={copy} className={btn}>
        {copied ? (
          <Check className="h-4 w-4 text-brand-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "تم النسخ" : "نسخ الرابط"}
      </button>
      <a
        href={qrImg}
        target="_blank"
        rel="noopener noreferrer"
        download
        className={btn}
      >
        <Download className="h-4 w-4" />
        تحميل الكود
      </a>
      <button type="button" onClick={() => window.print()} className={btn}>
        <Printer className="h-4 w-4" />
        طباعة
      </button>
    </div>
  )
}
