import { Button, Card } from "@life-id/ui"
import { HeartPulse, ShieldCheck, QrCode } from "lucide-react"

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-8 w-8 text-brand-500" />
        <span className="font-display text-2xl font-extrabold">Life ID</span>
      </div>
      <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight">
        هوية طبية موحّدة لكل شخص
      </h1>
      <p className="mt-3 max-w-2xl text-slate-500">
        ملف طبي واحد، حجز وخصومات، وبطاقة طوارئ تنقذ حياتك.
      </p>
      <div className="mt-8 flex gap-3">
        <Button>ابدأ الآن</Button>
        <Button variant="outline">لمقدمي الخدمة</Button>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card><ShieldCheck className="h-6 w-6 text-brand-500" /><h3 className="mt-2 font-display font-bold">RBAC لكل جهة</h3></Card>
        <Card><QrCode className="h-6 w-6 text-brand-500" /><h3 className="mt-2 font-display font-bold">Emergency QR</h3></Card>
        <Card><HeartPulse className="h-6 w-6 text-brand-500" /><h3 className="mt-2 font-display font-bold">محرّك الخصومات</h3></Card>
      </div>
    </main>
  )
}
