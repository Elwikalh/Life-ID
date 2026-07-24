import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"
import {
  getDoctorLedger,
  getPartnerLedger,
  getPayoutDetails,
} from "../../../lib/wallet"
import {
  savePayoutDetailsAction,
  requestPayoutAction,
  markPayoutSentAction,
  confirmPayoutReceivedAction,
} from "../../../lib/walletActions"
import {
  Wallet,
  HandCoins,
  CheckCircle2,
  Landmark,
  Info,
  Send,
  Clock,
} from "lucide-react"

export const dynamic = "force-dynamic"

const ROLE_LABELS: Record<string, string> = {
  pharmacy: "صيدلية",
  lab: "معمل تحاليل",
  radiology: "مركز أشعة",
  hospital: "مستشفى",
  pharma_company: "شركة أدوية",
  doctor: "طبيب",
}

const PARTNER_ROLES = [
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
  "clinic",
]

function egp(n: number) {
  return n.toLocaleString("en-US") + " ج.م"
}

type Details = Awaited<ReturnType<typeof getPayoutDetails>>

function payoutLines(d: Details) {
  return [
    d.payoutName ? "الاسم: " + d.payoutName : "",
    d.payoutInstapay ? "انستاباي: " + d.payoutInstapay : "",
    d.payoutMobile ? "محفظة موبايل: " + d.payoutMobile : "",
    d.payoutBank ? "البنك: " + d.payoutBank : "",
    d.payoutAccount ? "الحساب: " + d.payoutAccount : "",
    d.payoutNote ? "أخرى: " + d.payoutNote : "",
  ].filter(Boolean)
}

export default async function WalletPage() {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const meta = u.publicMetadata as { role?: string }
  const role = meta.role || ""
  if (role === "patient") redirect("/profile")

  const [ledger, details, sentPayouts, partner] = await Promise.all([
    getDoctorLedger(u.id),
    getPayoutDetails(u.id),
    prisma.payoutRequest.findMany({
      where: { doctorId: u.id, status: "sent" },
      include: { partner: { select: { fullName: true } } },
      orderBy: { sentAt: "desc" },
    }),
    getPartnerLedger(u.id),
  ])

  // تجميع اللي على الشريك حسب كل طبيب
  const owedMap = new Map<string, { name: string; amount: number }>()
  for (const d of partner.debts) {
    const cur = owedMap.get(d.creditorId) ?? {
      name: d.creditor?.fullName ?? "طبيب",
      amount: 0,
    }
    cur.amount += d.amount
    owedMap.set(d.creditorId, cur)
  }
  const owedList = Array.from(owedMap.values()).sort(
    (a, b) => b.amount - a.amount,
  )

  const toSend = partner.requests.filter((r) => r.status === "requested")
  const awaitingDoctor = partner.requests.filter((r) => r.status === "sent")
  const toSendDetails = await Promise.all(
    toSend.map((r) => getPayoutDetails(r.doctorId)),
  )

  const isCreditor =
    role === "doctor" || ledger.partners.length > 0 || sentPayouts.length > 0
  const isDebtor =
    PARTNER_ROLES.includes(role) ||
    partner.debts.length > 0 ||
    partner.requests.length > 0

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
            مستحقاتك عند الشركاء، اللي عليك للأطباء، وبيانات استلام الأموال.
          </p>
        </div>
      </div>

      {/* ============ جهة الدائن (مستحقاتك) ============ */}
      {isCreditor && (
        <>
          <div className={card}>
            <div className="text-sm text-slate-500">إجمالي المستحق لك</div>
            <div className="mt-1 text-3xl font-extrabold text-brand-700">
              {egp(ledger.total)}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              دي المبالغ اللي مقدمو الخدمة مدينين بيها ليك حسب نسبة الشراكة.
              التحويل بيتم خارج التطبيق (انستاباي/تحويل) بعد ما تطلب المبلغ.
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
            <h2 className="mb-3 font-bold text-slate-900">
              المستحقات حسب كل شريك
            </h2>
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
                        {ROLE_LABELS[p.partnerRole] ?? p.partnerRole} ·{" "}
                        {p.count} عملية
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
              <h2 className="font-bold text-slate-900">
                بيانات استقبال أموالك
              </h2>
            </div>
            <p className="mb-3 flex items-start gap-1 text-xs text-slate-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              دي البيانات اللي بتظهر للشريك لما تطلب المبلغ عشان يحوّلهولك. اكتب
              اللي متاح ليك وسيب الباقي فاضي.
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
        </>
      )}

      {/* ============ جهة المدين (اللي عليك) ============ */}
      {isDebtor && (
        <>
          <div className={card}>
            <div className="text-sm text-slate-500">
              إجمالي اللي عليك للأطباء
            </div>
            <div className="mt-1 text-3xl font-extrabold text-rose-600">
              {egp(partner.total)}
            </div>
            {owedList.length > 0 && (
              <div className="mt-3 space-y-1">
                {owedList.map((o, i) => (
                  <div
                    key={i}
                    className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0"
                  >
                    <span className="text-slate-700">{o.name}</span>
                    <span className="font-semibold text-slate-900">
                      {egp(o.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {toSend.length > 0 && (
            <div className={card}>
              <h2 className="mb-3 font-bold text-slate-900">
                طلبات صرف مطلوب إرسالها
              </h2>
              <div className="space-y-3">
                {toSend.map((r, i) => {
                  const lines = payoutLines(toSendDetails[i])
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-800">
                          {r.doctor?.fullName ?? "طبيب"} — {egp(r.amount)}
                        </div>
                        <form action={markPayoutSentAction}>
                          <input type="hidden" name="payoutId" value={r.id} />
                          <button type="submit" className={btn}>
                            <Send className="h-4 w-4" />
                            تم الإرسال
                          </button>
                        </form>
                      </div>
                      <div className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-slate-600">
                        <div className="mb-1 font-semibold text-slate-700">
                          حوّل المبلغ على البيانات دي (خارج التطبيق):
                        </div>
                        {lines.length > 0 ? (
                          <ul className="list-inside list-disc space-y-0.5">
                            {lines.map((l, j) => (
                              <li key={j}>{l}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-rose-500">
                            الطبيب لم يحدّد بيانات استقبال بعد.
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {awaitingDoctor.length > 0 && (
            <div className={card}>
              <h2 className="mb-3 font-bold text-slate-900">
                بانتظار تأكيد الطبيب
              </h2>
              <div className="space-y-2">
                {awaitingDoctor.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                  >
                    <Clock className="h-4 w-4 text-slate-400" />
                    أرسلت {egp(r.amount)} لـ {r.doctor?.fullName ?? "طبيب"} —
                    بانتظار تأكيد الاستلام.
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
