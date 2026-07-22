import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import SiteHeader from "../components/SiteHeader"
import Breadcrumbs from "../components/Breadcrumbs"
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
          <SiteHeader />
          <Breadcrumbs />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
