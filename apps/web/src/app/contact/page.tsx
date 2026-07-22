import { prisma } from "@life-id/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Mail, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

async function submitContact(formData: FormData) {
  "use server"
  const name = String(formData.get("name") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const subject = String(formData.get("subject") || "").trim()
  const message = String(formData.get("message") || "").trim()
  if (!name || !email || !message) return
  try {
    await prisma.contactMessage.create({
      data: { name, email, subject: subject || null, message },
    })
  } catch {}
  redirect("/contact?sent=1")
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const sp = await searchParams
  const sent = sp?.sent === "1"

  return (
    <main dir="rtl" className="mx-auto max-w-xl px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-extrabold">تواصل معنا</h1>
        <p className="mt-2 text-slate-500">عندك سؤال أو استفسار؟ ابعتلنا وهنرد عليك في أقرب وقت.</p>
      </div>

      {sent ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-brand-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>تم إرسال رسالتك بنجاح! هنتواصل معاك قريبًا.</div>
        </div>
      ) : null}

      <form action={submitContact} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">الاسم</label>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">الموضوع (اختياري)</label>
          <input
            name="subject"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">الرسالة</label>
          <textarea
            name="message"
            required
            rows={5}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
        >
          إرسال
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/" className="text-brand-600 hover:underline">← العودة للرئيسية</Link>
      </div>
    </main>
  )
}
