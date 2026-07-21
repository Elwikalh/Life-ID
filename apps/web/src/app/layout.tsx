import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Life ID",
  description: "هوية طبية موحّدة — Life ID"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
