import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import AppShell from "../components/AppShell"
import "./globals.css"

export const metadata: Metadata = {
  title: "Life ID",
  description: "هوية طبية موحّدة — Life ID",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl">
        <body>
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  )
}
