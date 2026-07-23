import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getReviewables, getRatingsMap } from "../../lib/reviews"
import { submitReview, deleteReview } from "../../lib/reviewActions"
import { ROLE_LABELS } from "../../lib/roles"
import { ArrowRight, Star, Send, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

const BANNERS: Record<string, { text: string; ok: boolean }> = {
  saved: { text: "تم حفظ تقييمك. شكرًا لمساهمتك!", ok: true },
  deleted: { text: "تم حذف تقييمك.", ok: true },
  invalid: { text: "اختر عدد النجوم أولًا.", ok: false },
  notallowed: {
    text: "تقدر تقيّم مقدم الخدمة بعد زيارة مكتملة فقط.",
    ok: false,
  },
  fail: { text: "حصل خطأ، حاول مرة أخرى.", ok: false },
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value)
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            "h-4 w-4 " +
            (i <= rounded ? "fill-amber-400 text-amber-400" : "text-slate-300")
          }
        />
      ))}
    </span>
  )
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const role = (user.publicMetadata as { role?: string })?.role
  if (role !== "patient") redirect("/dashboard")

  const sp = await searchParams
  const banner = sp.ok ? BANNERS[sp.ok] : sp.error ? BANNERS[sp.error] : null

  const reviewables = await getReviewables(user.id)
  const ratings = await getRatingsMap(reviewables.map((r) => r.providerId))

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للوحة
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">تقييماتي</h1>
        <p className="text-sm text-slate-500">
          قيّم مقدّمي الخدمة اللي زرتهم عشان تساعد باقي المرضى.
        </p>
      </div>

      {banner && (
        <div
          className={
            "rounded-xl px-4 py-3 text-sm " +
            (banner.ok
              ? "bg-brand-50 text-brand-700"
              : "bg-danger/10 text-danger")
          }
        >
          {banner.text}
        </div>
      )}

      {reviewables.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          لسه مفيش زيارات مكتملة تقدر تقيّمها. بعد أول زيارة تخلص هتلاقيها هنا.
        </div>
      ) : (
        <ul className="space-y-4">
          {reviewables.map((p) => {
            const rating = ratings[p.providerId] ?? { avg: 0, count: 0 }
            const mine = p.myReview
            return (
              <li
                key={p.providerId}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {p.providerName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ROLE_LABELS[p.role] ?? p.role}
                    </p>
                  </div>
                  <div className="text-left">
                    <Stars value={rating.avg} />
                    <p className="text-xs text-slate-400">
                      {rating.count > 0
                        ? `${rating.avg} من ٥ (${rating.count} تقييم)`
                        : "لا تقييمات بعد"}
                    </p>
                  </div>
                </div>

                <form
                  action={submitReview}
                  className="mt-4 space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4"
                >
                  <input type="hidden" name="providerId" value={p.providerId} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      تقييمك
                    </label>
                    <select
                      name="rating"
                      defaultValue={mine ? String(mine.rating) : "5"}
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    >
                      <option value="5">★★★★★ ممتاز</option>
                      <option value="4">★★★★ جيد جدًا</option>
                      <option value="3">★★★ جيد</option>
                      <option value="2">★★ مقبول</option>
                      <option value="1">★ سيئ</option>
                    </select>
                  </div>
                  <textarea
                    name="comment"
                    rows={3}
                    defaultValue={mine?.comment ?? ""}
                    placeholder="اكتب رأيك (اختياري)"
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                    >
                      <Send className="h-4 w-4" />
                      {mine ? "تحديث التقييم" : "إرسال التقييم"}
                    </button>
                    {mine && (
                      <span className="text-xs text-slate-400">
                        قيّمت بـ {mine.rating} من ٥
                      </span>
                    )}
                  </div>
                </form>

                {mine && (
                  <form action={deleteReview} className="mt-2">
                    <input
                      type="hidden"
                      name="providerId"
                      value={p.providerId}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف تقييمي
                    </button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
