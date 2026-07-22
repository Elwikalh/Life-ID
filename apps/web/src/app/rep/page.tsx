import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import { linkRepAccount, logVisit, deleteVisit } from "../../lib/repPortalActions";
import {
  ArrowRight,
  Users,
  KeyRound,
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Plus,
  Trash2,
  Stethoscope,
  CalendarDays,
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

const OUTCOMES = [
  "زيارة ناجحة",
  "الطبيب مشغول",
  "مؤجلة",
  "طلب عينات",
  "طلب معلومات",
  "أخرى",
];

function fmtDate(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function RepPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  const meta = u.publicMetadata as { role?: Role };
  if (meta.role !== "medical_rep") redirect("/profile");

  const sp = await searchParams;
  const linked = sp.linked === "1";
  const visitSaved = sp.visit === "1";
  const visitDeleted = sp.vdeleted === "1";
  const error = typeof sp.error === "string" ? sp.error : null;

  let rep: {
    id: string;
    name: string;
    region: string | null;
    phone: string | null;
    company: { fullName: string } | null;
  } | null = null;
  try {
    rep = await prisma.medicalRep.findFirst({
      where: { linkedUserId: u.id },
      select: {
        id: true,
        name: true,
        region: true,
        phone: true,
        company: { select: { fullName: true } },
      },
    });
  } catch {
    rep = null;
  }

  let visits: Array<{
    id: string;
    doctorName: string;
    specialty: string | null;
    region: string | null;
    outcome: string | null;
    note: string | null;
    visitDate: Date;
  }> = [];
  if (rep) {
    try {
      visits = await prisma.repVisit.findMany({
        where: { repId: rep.id },
        orderBy: { visitDate: "desc" },
        select: {
          id: true,
          doctorName: true,
          specialty: true,
          region: true,
          outcome: true,
          note: true,
          visitDate: true,
        },
      });
    } catch {
      visits = [];
    }
  }

  const today = fmtDate(new Date()).replace(/\//g, "-");

  return (
    <div dir="rtl" className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للوحة
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#0f766e]">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">بوابة المندوب</h1>
          <p className="text-sm text-slate-500">
            اربط حسابك بشركتك وسجّل زياراتك للأطباء.
          </p>
        </div>
      </div>

      {linked && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم ربط حسابك بالشركة بنجاح.
        </div>
      )}
      {visitSaved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم تسجيل الزيارة بنجاح.
        </div>
      )}
      {visitDeleted && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <CheckCircle2 className="h-4 w-4" />
          تم حذف الزيارة.
        </div>
      )}
      {error === "invalid" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          الكود غلط أو مستخدم قبل كده. راجع الشركة.
        </div>
      )}
      {error === "empty" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          من فضلك اكتب كود الربط.
        </div>
      )}
      {error === "doctor" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          من فضلك اكتب اسم الطبيب.
        </div>
      )}
      {(error === "server" || error === "visit") && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          حصل خطأ مؤقت، حاول تاني.
        </div>
      )}

      {!rep ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#1fb2a3]" />
            <h2 className="text-lg font-bold text-slate-900">ربط الحساب</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            اطلب كود الربط من الشركة اللي بتشتغل معاها، واكتبه هنا عشان
            تربط حسابك.
          </p>
          <form action={linkRepAccount} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                كود الربط
              </label>
              <input
                id="code"
                name="code"
                required
                dir="ltr"
                autoComplete="off"
                placeholder="مثال: A3K9PT"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-bold uppercase tracking-widest outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
            >
              <KeyRound className="h-4 w-4" />
              ربط الحساب
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-gradient-to-l from-[#1fb2a3] to-[#178f83] px-6 py-4 text-white">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {rep.company?.fullName ?? "شركة الأدوية"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 p-6">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Users className="h-4 w-4 text-[#1fb2a3]" />
                <span className="font-semibold">{rep.name}</span>
              </div>
              {rep.region ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {rep.region}
                </div>
              ) : null}
              {rep.phone ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span dir="ltr">{rep.phone}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#1fb2a3]" />
              <h2 className="text-lg font-bold text-slate-900">تسجيل زيارة</h2>
            </div>
            <form action={logVisit} className="space-y-4">
              <div>
                <label
                  htmlFor="doctorName"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  اسم الطبيب
                </label>
                <div className="relative">
                  <Stethoscope className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="doctorName"
                    name="doctorName"
                    required
                    placeholder="د. محمد أحمد"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="specialty"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    تخصص الطبيب — اختياري
                  </label>
                  <input
                    id="specialty"
                    name="specialty"
                    placeholder="باطنة، أطفال..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="region"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    المنطقة — اختياري
                  </label>
                  <input
                    id="region"
                    name="region"
                    list="region-options"
                    defaultValue={rep.region ?? ""}
                    autoComplete="off"
                    placeholder="اختر المحافظة"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                  <datalist id="region-options">
                    {REGIONS.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="outcome"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    نتيجة الزيارة
                  </label>
                  <select
                    id="outcome"
                    name="outcome"
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  >
                    <option value="">— اختر —</option>
                    {OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="visitDate"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    تاريخ الزيارة
                  </label>
                  <input
                    id="visitDate"
                    name="visitDate"
                    type="date"
                    defaultValue={today}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
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
                  placeholder="تفاصيل الزيارة أو ملاحظات مهمة"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
              >
                <Plus className="h-4 w-4" />
                تسجيل الزيارة
              </button>
            </form>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">زياراتي</h2>
              <span className="rounded-full bg-[#1fb2a3]/10 px-3 py-1 text-xs font-semibold text-[#0f766e]">
                {visits.length} زيارة
              </span>
            </div>
            {visits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                لسه مفيش زيارات مسجّلة — ابدأ بتسجيل أول زيارة من الفورم فوق.
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {v.doctorName}
                          </span>
                          {v.specialty ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                              {v.specialty}
                            </span>
                          ) : null}
                          {v.outcome ? (
                            <span className="rounded-full bg-[#1fb2a3]/10 px-2 py-0.5 text-[11px] font-medium text-[#0f766e]">
                              {v.outcome}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {fmtDate(v.visitDate)}
                          </span>
                          {v.region ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {v.region}
                            </span>
                          ) : null}
                        </div>
                        {v.note ? (
                          <p className="mt-2 text-sm text-slate-600">{v.note}</p>
                        ) : null}
                      </div>
                      <form action={deleteVisit}>
                        <input type="hidden" name="id" value={v.id} />
                        <button
                          type="submit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="حذف الزيارة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
