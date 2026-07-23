import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Role } from "@life-id/types"
import { prisma } from "@life-id/db"
import {
  startNegotiation,
  respondNegotiation,
  cancelNegotiation,
} from "../../lib/negotiationActions"
import {
  Handshake,
  Send,
  Check,
  X,
  Repeat,
  Inbox,
  ArrowRight,
  Trash2,
  Clock,
  CheckCircle2,
  Percent,
} from "lucide-react"

export const dynamic = "force-dynamic"

const PARTNER_ROLES: Role[] = [
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
]

const TYPE_LABELS: Record<string, string> = {
  pharmacy: "صيدلية",
  lab: "معمل تحاليل",
  radiology: "مركز أشعة",
  hospital: "مستشفى / مركز طبي",
  pharma_company: "شركة أدوية",
}

const BANNERS: Record<string, { text: string; ok: boolean }> = {
  sent: { text: "تم إرسال عرض التفاوض للجهة.", ok: true },
  accepted: { text: "تم الاتفاق! اتضافت الشراكة تلقائياً.", ok: true },
  rejected: { text: "تم رفض العرض.", ok: true },
  countered: { text: "تم إرسال العرض المقابل.", ok: true },
  cancelled: { text: "تم سحب العرض.", ok: true },
  invalid: { text: "اختر جهة صحيحة للتفاوض.", ok: false },
  fail: { text: "حصل خطأ، حاول تاني.", ok: false },
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

type Inv = {
  id: string
  inviterId: string
  inviteeUserId: string | null
  inviteeName: string
  inviteeType: string
  status: string
  currentPct: number | null
  requestedPct: number | null
  lastActor: string | null
  message: string | null
  createdAt: Date
}

function computeMyTurn(inv: Inv, isInviter: boolean) {
  const isOpen = inv.status === "pending" || inv.status === "countered"
  const inviteeTurn =
    inv.status === "pending" ||
    (inv.status === "countered" && inv.lastActor === "inviter")
  const inviterTurn = inv.status === "countered" && inv.lastActor === "invitee"
  return isOpen && (isInviter ? inviterTurn : inviteeTurn)
}

function StatusChip({ inv, isInviter }: { inv: Inv; isInviter: boolean }) {
  if (inv.status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> تم الاتفاق
      </span>
    )
  }
  if (inv.status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        <X className="h-3.5 w-3.5" /> مرفوضة
      </span>
    )
  }
  if (computeMyTurn(inv, isInviter)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#1fb2a3]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f766e]">
        <Clock className="h-3.5 w-3.5" /> دورك للرد
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3.5 w-3.5" /> بانتظار الطرف الآخر
    </span>
  )
}

function ActionPanel({ inv }: { inv: Inv }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form action={respondNegotiation}>
        <input type="hidden" name="id" value={inv.id} />
        <input type="hidden" name="decision" value="accept" />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-[#1fb2a3] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f766e]"
        >
          <Check className="h-3.5 w-3.5" /> موافقة على {inv.currentPct ?? 0}%
        </button>
      </form>
      <form action={respondNegotiation}>
        <input type="hidden" name="id" value={inv.id} />
        <input type="hidden" name="decision" value="reject" />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
        >
          <X className="h-3.5 w-3.5" /> رفض
        </button>
      </form>
      <form action={respondNegotiation} className="inline-flex items-center gap-1">
        <input type="hidden" name="id" value={inv.id} />
        <input type="hidden" name="decision" value="counter" />
        <input
          type="number"
          name="counterPct"
          min={0}
          max={100}
          defaultValue={inv.currentPct ?? 0}
          className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        />
        <span className="text-xs text-slate-500">%</span>
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-3 py-1.5 text-xs font-medium text-[#0f766e] transition hover:bg-[#1fb2a3]/20"
        >
          <Repeat className="h-3.5 w-3.5" /> عرض مقابل
        </button>
      </form>
    </div>
  )
}

function Card({ inv, isInviter }: { inv: Inv; isInviter: boolean }) {
  const myTurn = computeMyTurn(inv, isInviter)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              {inv.inviteeName}
            </span>
            <span className="rounded-full bg-[#1fb2a3]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f766e]">
              {TYPE_LABELS[inv.inviteeType] ?? inv.inviteeType}
            </span>
            <StatusChip inv={inv} isInviter={isInviter} />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {fmtDate(inv.createdAt)}
            {" · "}
            {isInviter ? "أنت طلبت التفاوض" : "وصلك عرض تفاوض"}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
          <Percent className="h-3.5 w-3.5 text-[#0f766e]" />
          {inv.currentPct ?? 0}%
        </div>
      </div>

      {inv.message ? (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {inv.message}
        </p>
      ) : null}

      <div className="mt-2 text-xs text-slate-500">
        {inv.lastActor === "inviter"
          ? "آخر عرض من مقدّم الخدمة"
          : inv.lastActor === "invitee"
            ? "آخر عرض من الجهة"
            : null}
      </div>

      {myTurn ? <ActionPanel inv={inv} /> : null}

      {isInviter && inv.status !== "accepted" ? (
        <form action={cancelNegotiation} className="mt-3">
          <input type="hidden" name="id" value={inv.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            title="سحب العرض"
          >
            <Trash2 className="h-3.5 w-3.5" /> سحب
          </button>
        </form>
      ) : null}
    </div>
  )
}

export default async function NegotiationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const role = (u.publicMetadata as { role?: string })?.role
  if (!role) redirect("/onboarding")
  if (role === "patient") redirect("/dashboard")

  const sp = await searchParams
  const banner = sp?.ok ? BANNERS[sp.ok] : sp?.error ? BANNERS[sp.error] : null

  const [sentRaw, receivedRaw, entities] = await Promise.all([
    prisma.invitation.findMany({
      where: { inviterId: u.id, NOT: { inviteeUserId: null } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.findMany({
      where: { inviteeUserId: u.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: { in: PARTNER_ROLES }, NOT: { id: u.id } },
      select: { id: true, fullName: true, role: true, city: true },
      orderBy: { fullName: "asc" },
    }),
  ])

  const sent = sentRaw as unknown as Inv[]
  const received = receivedRaw as unknown as Inv[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-[#0f766e]"
        >
          <ArrowRight className="h-4 w-4" /> لوحة التحكم
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Handshake className="h-6 w-6 text-[#1fb2a3]" /> التفاوض على الخصومات
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          اتفق مع الصيدليات والمعامل والجهات على نسبة الخصم برد متبادل؛ وعند
          الاتفاق تتحوّل تلقائياً لشراكة.
        </p>
      </div>

      {banner ? (
        <div
          className={
            "mb-5 rounded-xl px-4 py-3 text-sm " +
            (banner.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600")
          }
        >
          {banner.text}
        </div>
      ) : null}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <Send className="h-4 w-4 text-[#1fb2a3]" /> ابدأ تفاوض جديد
        </h2>
        {entities.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
            مفيش جهات مسجّلة للتفاوض معاها دلوقتي.
          </p>
        ) : (
          <form action={startNegotiation} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                الجهة
              </label>
              <select
                name="inviteeUserId"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  — اختر جهة —
                </option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} · {TYPE_LABELS[e.role] ?? e.role}
                    {e.city ? " · " + e.city : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                نسبة الخصم المقترحة (%)
              </label>
              <input
                type="number"
                name="proposedPct"
                min={0}
                max={100}
                defaultValue={10}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                رسالة (اختياري)
              </label>
              <textarea
                name="message"
                rows={2}
                placeholder="مثال: نود تعاون دائم لمرضانا..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1fb2a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
            >
              <Handshake className="h-4 w-4" /> ابدأ التفاوض
            </button>
          </form>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <Inbox className="h-4 w-4 text-[#1fb2a3]" /> عروض وصلتك ({received.length})
        </h2>
        {received.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            مفيش عروض تفاوض وصلتلك لسه.
          </p>
        ) : (
          <div className="space-y-3">
            {received.map((inv) => (
              <Card key={inv.id} inv={inv} isInviter={false} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
          <Send className="h-4 w-4 text-[#1fb2a3]" /> عروض أرسلتها ({sent.length})
        </h2>
        {sent.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            لسه مبدأتش أي تفاوض. ابدأ واحد من فوق.
          </p>
        ) : (
          <div className="space-y-3">
            {sent.map((inv) => (
              <Card key={inv.id} inv={inv} isInviter={true} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
