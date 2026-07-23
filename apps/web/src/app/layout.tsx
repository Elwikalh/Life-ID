import type { Metadata } from "next"
import { cookies } from "next/headers"
import { currentUser } from "@clerk/nextjs/server"
import { ClerkProvider } from "@clerk/nextjs"
import AppShell from "../components/AppShell"
import { defaultLangForRole, dirFor, type Lang } from "../lib/i18n"
import "./globals.css"

export const metadata: Metadata = {
  title: "Life ID",
  description: "Unified medical identity — Life ID",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get("lang")?.value
  let lang: Lang
  if (cookieLang === "ar" || cookieLang === "en") {
    lang = cookieLang
  } else {
    const user = await currentUser()
    const role = (user?.publicMetadata as { role?: string } | undefined)?.role
    lang = defaultLangForRole(role)
  }

  return (
    <ClerkProvider>
      <html lang={lang} dir={dirFor(lang)}>
        <body>
          <AppShell lang={lang}>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  )
}
