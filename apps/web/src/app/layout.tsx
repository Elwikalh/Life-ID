import type { Metadata } from "next"
import Link from "next/link"
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { HeartPulse } from "lucide-react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Life ID",
  description: "هوية طبية موحّدة — Life ID"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl">
        <body>
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
