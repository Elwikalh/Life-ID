import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"
import { getDoctorLedger, getPayoutDetails } from "../../../lib/wallet"
import {
  savePayoutDetailsAction,
  requestPayoutAction,
  confirmPayoutReceivedAction,
} from "../../../lib/walletActions"
import { Wallet, HandCoins, CheckCircle2, Landmark, Info } from "lucide-react"

export const dynamic = "force-dynamic"

const ROLE_LABELS: Record<string, string> = {
  pharmacy: "صيدلية",
  lab: "معمل تحاليل",
  radiology: "مركز أشعة",
  hospital: "مستشفى",
  pharma_company: "شركة أدوية",
  doctor: "طبيب",
}

function egp(n: number) {
  return n.toLocaleString("en-US") + " ج.م"
}

export default async function WalletPage() {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const meta = u.publicMetadata as { role?: string }
  if (meta.role === "patient") redirect("/profile")

  const [ledger, details, sentPayouts] = await Promise.all([
    getDoctorLedger(u.id),
    getPayoutDetails(u.id),
    prisma.payoutRequest.findMany({
      where: { doctorId: u.id, status: "sent" },
      include: { partner: { select: { fullName: true } } },
      orderBy: { sentAt: "desc" },
    }),
  ])

  const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
  const input =
    "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
  const btn =
    "inline-flex items-center gap-1 rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-brand-50 p-2 text-brand-700">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">المحفظة</h1>
          <p className="text-sm text-slate-500">
            مستحقاتك عند مقدمي الخدمة، وطلبات الصرف، وبيانات استلام أموالك.
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm text-slate-500">إجمالي المستحق لك</div>
        <div className="mt-1 text-3xl font-extrabold text-brand-700">
          {egp(ledger.total)}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          دي المبالغ اللي مقدمو الخدمة مدينين بيها ليك حسب نسبة الشراكة. التحويل
          بيتم خارج التطبيق (انستاباي/تحويل) بعد ما تطلب المبلغ.
        </p>
      </div>

      {sentPayouts.length > 0 && (
        <div className={card}>
          <h2 className="mb-3 font-bold text-slate-900">
            بانتظار تأكيد استلامك
          </h2>
          <div className="space-y-2">
            {sentPayouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <div className="text-sm">
                  <div className="font-semibold text-slate-800">
                    {p.partner?.fullName ?? "شريك"}
                  </div>
                  <div className="text-slate-500">
                    أرسل {egp(p.amount)} — أكّد الاستلام
                  </div>
                </div>
                <form action={confirmPayoutReceivedAction}>
                  <input type="hidden" name="payoutId" value={p.id} />
                  <button type="submit" className={btn}>
                    <CheckCircle2 className="h-4 w-4" />
                    تم الاستلام
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={card}>
        <h2 className="mb-3 font-bold text-slate-900">المستحقات حسب كل شريك</h2>
        {ledger.partners.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            لا توجد مستحقات حاليًا.
          </div>
        ) : (
          <div className="space-y-2">
            {ledger.partners.map((p) => (
              <div
                key={p.partnerId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3"
              >
                <div className="text-sm">
                  <div className="font-semibold text-slate-800">
                    {p.partnerName}
                  </div>
                  <div className="text-slate-500">
                    {ROLE_LABELS[p.partnerRole] ?? p.partnerRole} · {p.count}{" "}
                    عملية
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      متاح للطلب: {egp(p.open)}
                    </span>
                    {p.requested > 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                        قيد الطلب: {egp(p.requested)}
                      </span>
                    )}
                    {p.sent > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-600">
                        بانتظار تأكيدك: {egp(p.sent)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="text-xs text-slate-400">الإجمالي</div>
                    <div className="font-bold text-brand-700">
                      {egp(p.total)}
                    </div>
                  </div>
                  {p.open > 0 && (
                    <form action={requestPayoutAction}>
                      <input
                        type="hidden"
                        name="partnerId"
                        value={p.partnerId}
                      />
                      <button type="submit" className={btn}>
                        <HandCoins className="h-4 w-4" />
                        طلب المبلغ
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <div className="mb-1 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand-700" />
          <h2 className="font-bold text-slate-900">بيانات استقبال أموالك</h2>
        </div>
        <p className="mb-3 flex items-start gap-1 text-xs text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          دي البيانات اللي بتظهر لمقدم الخدمة لما تطلب المبلغ عشان يحوّلهولك.
          اكتب اللي متاح ليك وسيب الباقي فاضي.
        </p>
        <form
          action={savePayoutDetailsAction}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="text-sm">
            <span className="text-slate-600">اسم صاحب الحساب</span>
            <input
              name="payoutName"
              defaultValue={details.payoutName}
              className={input}
              placeholder="مثال: د. أحمد سمير"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">معرّف/رابط انستاباي</span>
            <input
              name="payoutInstapay"
              defaultValue={details.payoutInstapay}
              className={input}
              placeholder="example@instapay"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">
              رقم محفظة موبايل (فودافون كاش…)
            </span>
            <input
              name="payoutMobile"
              defaultValue={details.payoutMobile}
              className={input}
              placeholder="010xxxxxxxx"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">اسم البنك</span>
            <input
              name="payoutBank"
              defaultValue={details.payoutBank}
              className={input}
              placeholder="مثال: البنك الأهلي"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">رقم الحساب / IBAN</span>
            <input
              name="payoutAccount"
              defaultValue={details.payoutAccount}
              className={input}
              placeholder="EG.."
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">أي وسيلة أخرى / ملاحظة</span>
            <input
              name="payoutNote"
              defaultValue={details.payoutNote}
              className={input}
              placeholder="اكتب أي بيانات استلام أخرى"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={btn}>
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
