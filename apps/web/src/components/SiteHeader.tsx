"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HeartPulse } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

export default function SiteHeader() {
  const pathname = usePathname()

  // Landing ("/") and the admin dashboard have their own chrome, so hide the app header there.
  if (pathname === "/" || pathname.startsWith("/admin")) return null

  return (
    <header className="flex items-center justify-between border-b border-black/5 px-6 py-3">
      <Link href="/" className="flex items-center gap-2 font-display font-extrabold">
        <HeartPulse className="h-6 w-6 text-brand-500" />
        Life ID
      </Link>
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
