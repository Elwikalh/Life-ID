import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import { PROVIDER_ROLES } from "../../../lib/providers";
import { saveService } from "../../../lib/serviceActions"
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  CalendarDays,
  Truck,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

// المحافظات — حقل ثابت/متكرر فبيكون اختيار من قائمة بحث
// أيام العمل (معرّفة هنا لأن ملف "use server" ما يصحّش يصدّر قيم غير async)
const WORK_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
]

// المحافظات — حقل ثابت/متكرر فبيكون اختيار من قائمة بحث
const CITIES = [
const CITIES = [
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
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "مطروح",
  "الوادي الجديد",
  "شمال سيناء",
  "جنوب سيناء",
];

// أوقات العمل (كل نص ساعة)
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
})();

export default async function EditServicePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  const meta = u.publicMetadata as { role?: Role };
  if (!meta.role) redirect("/onboarding");
  if (!PROVIDER_ROLES.includes(meta.role)) redirect("/profile");

  const sp = await searchParams;
  const saved = sp?.saved === "1";

  let svc: {
    branchesCount: number | null;
    city: string | null;
    clinicLocation: string | null;
    workingDays: string[];
    workFrom: string | null;
    workTo: string | null;
    homeService: boolean;
    paymentPolicy: string | null;
  } | null = null;
  try {
    svc = await prisma.user.findUnique({
      where: { id: u.id },
      select: {
        branchesCount: true,
        city: true,
        clinicLocation: true,
        workingDays: true,
        workFrom: true,
        workTo: true,
        homeService: true,
        paymentPolicy: true,
      },
    });
  } catch {}

  const selectedDays = new Set(svc?.workingDays ?? []);
  const fieldCls =
    "w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للبروفايل
        </Link>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">تعديل الخدمة</h1>
        <p className="mb-6 text-sm text-slate-500">
          حدّد تفاصيل عيادتك ومواعيد العمل وسياسة الدفع عشان تظهر للمرضى وقت
          الحجز.
        </p>

        {saved && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
            <CheckCircle2 className="h-4 w-4" />
            تم حفظ بيانات الخدمة بنجاح
          </div>
        )}

        <form action={saveService} className="space-y-4">
          {/* عدد الفروع */}
          <div>
            <label htmlFor="branchesCount" className={labelCls}>
              عدد الفروع
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="branchesCount"
                name="branchesCount"
                type="number"
                min={1}
                max={50}
                step={1}
                defaultValue={svc?.branchesCount ?? 1}
                className={fieldCls}
              />
            </div>
          </div>

          {/* المدينة */}
          <div>
            <label htmlFor="city" className={labelCls}>
              المدينة / المحافظة
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="city"
                name="city"
                list="city-options"
                defaultValue={svc?.city ?? ""}
                placeholder="ابحث واختار المحافظة"
                autoComplete="off"
                className={fieldCls}
              />
              <datalist id="city-options">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* العنوان */}
          <div>
            <label htmlFor="clinicLocation" className={labelCls}>
              عنوان العيادة
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="clinicLocation"
                name="clinicLocation"
                defaultValue={svc?.clinicLocation ?? ""}
                placeholder="الحي / الشارع / علامة مميزة"
                className={fieldCls}
              />
            </div>
          </div>

          {/* أيام العمل */}
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                أيام العمل
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WORK_DAYS.map((d) => (
                <label
                  key={d}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition has-[:checked]:border-[#1fb2a3] has-[:checked]:bg-[#1fb2a3]/10 has-[:checked]:text-[#0f766e]"
                >
                  <input
                    type="checkbox"
                    name={"day_" + d}
                    defaultChecked={selectedDays.has(d)}
                    className="h-4 w-4 accent-[#1fb2a3]"
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>

          {/* مواعيد العمل */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="workFrom" className={labelCls}>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  من الساعة
                </span>
              </label>
              <select
                id="workFrom"
                name="workFrom"
                defaultValue={svc?.workFrom ?? ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
              >
                <option value="">—</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="workTo" className={labelCls}>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  إلى الساعة
                </span>
              </label>
              <select
                id="workTo"
                name="workTo"
                defaultValue={svc?.workTo ?? ""}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
              >
                <option value="">—</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* خدمة منزلية */}
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1">
                <Truck className="h-4 w-4 text-slate-400" />
                بتقدم خدمة / زيارة منزلية؟
              </span>
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition has-[:checked]:border-[#1fb2a3] has-[:checked]:bg-[#1fb2a3]/10 has-[:checked]:text-[#0f766e]">
                <input
                  type="radio"
                  name="homeService"
                  value="yes"
                  defaultChecked={svc?.homeService === true}
                  className="h-4 w-4 accent-[#1fb2a3]"
                />
                نعم
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition has-[:checked]:border-[#1fb2a3] has-[:checked]:bg-[#1fb2a3]/10 has-[:checked]:text-[#0f766e]">
                <input
                  type="radio"
                  name="homeService"
                  value="no"
                  defaultChecked={!svc || svc.homeService === false}
                  className="h-4 w-4 accent-[#1fb2a3]"
                />
                لا
              </label>
            </div>
          </div>

          {/* سياسة الدفع */}
          <div>
            <label htmlFor="paymentPolicy" className={labelCls}>
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-4 w-4 text-slate-400" />
                سياسة الدفع
              </span>
            </label>
            <textarea
              id="paymentPolicy"
              name="paymentPolicy"
              rows={4}
              defaultValue={svc?.paymentPolicy ?? ""}
              placeholder="اكتب سياسة الدفع (كاش / فيزا / محفظة إلكترونية... إلخ)"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            حفظ الخدمة
          </button>
        </form>
      </div>
    </div>
  );
}
