import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import { addRep, deleteRep } from "../../../lib/repActions";
import {
  ArrowRight,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

const REGIONS = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الشرقية",
  "الغربية",
  "المنوفية",
  "البحيرة",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "بني سويف",
  "الفيوم",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "مطروح",
];

export default async function RepsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  const meta = u.publicMetadata as { role?: Role };
  if (meta.role !== "pharma_company") redirect("/profile");

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const deleted = sp.deleted === "1";
  const error = typeof sp.error === "string" ? sp.error : null;

  let reps: Array<{
    id: string;
    name: string;
    phone: string | null;
    region: string | null;
    note: string | null;
  }> = [];
  try {
    reps = await prisma.medicalRep.findMany({
      where: { companyId: u.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        region: true,
        note: true,
      },
    });
  } catch {
    reps = [];
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للملف الشخصي
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#0f766e]">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">المناديب الطبيون</h1>
          <p className="text-sm text-slate-500">
            سجّل مناديب شركتك والمناطق اللي بيغطوها.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <div className="text-2xl font-bold text-slate-900">{reps.length}</div>
          <div className="text-xs text-slate-500">مندوب مسجّل</div>
        </div>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم إضافة المندوب بنجاح.
        </div>
      )}
      {deleted && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4" />
          تم حذف المندوب.
        </div>
      )}
      {error === "name" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          من فضلك اكتب اسم المندوب.
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">إضافة مندوب</h2>
        <form action={addRep} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              اسم المندوب
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="مثال: محمد أحمد"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                رقم الهاتف / واتساب
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-left text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="region"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                المنطقة
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="region"
                  name="region"
                  list="region-options"
                  placeholder="اختر أو اكتب"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                />
                <datalist id="region-options">
                  {REGIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="note"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              ملاحظات — اختياري
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="أي تفاصيل إضافية عن المندوب"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            <Plus className="h-4 w-4" />
            إضافة المندوب
          </button>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-slate-900">المناديب المسجّلون</h2>
        {reps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            لسه مفيش مناديب — ابدأ بإضافة أول مندوب من الفورم فوق.
          </div>
        ) : (
          <div className="space-y-3">
            {reps.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
                  <Users className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {r.name}
                    </span>
                    {r.region ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1fb2a3]/10 px-2 py-0.5 text-[10px] font-medium text-[#0f766e]">
                        <MapPin className="h-3 w-3" />
                        {r.region}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {r.phone ? (
                      <span dir="ltr" className="font-medium">
                        {r.phone}
                      </span>
                    ) : null}
                    {r.note ? <span>{r.note}</span> : null}
                  </div>
                </div>
                <form action={deleteRep}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
