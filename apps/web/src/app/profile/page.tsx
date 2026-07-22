import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { ROLE_LABELS } from "../../lib/roles";
import { prisma } from "@life-id/db";
import { saveProfile } from "../../lib/profileActions";
import { PROVIDER_ROLES, CONSULTATION_FEE } from "../../lib/providers";
import {
  CheckCircle2,
  Stethoscope,
  Phone,
  Wallet,
  FileText,
  Handshake,
  Mail,
  Activity,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

// قائمة التخصصات للبحث (Autocomplete) — حقل ثابت/متكرر لازم يكون اختيار من قائمة
const SPECIALTIES = [
  "باطنة عامة",
  "أطفال وحديثي الولادة",
  "نساء وتوليد",
  "جراحة عامة",
  "عظام",
  "قلب وأوعية دموية",
  "جلدية وتناسلية",
  "مخ وأعصاب",
  "أنف وأذن وحنجرة",
  "رمد وعيون",
  "مسالك بولية",
  "طب نفسي",
  "أسنان",
  "تخدير وعناية مركزة",
  "أشعة تشخيصية",
  "صدر وجهاز تنفسي",
  "كلى",
  "غدد صماء وسكر",
  "روماتيزم ومفاصل",
  "أورام",
  "جراحة تجميل",
  "مناعة وحساسية",
  "طب الأسرة",
  "طوارئ",
];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  const meta = u.publicMetadata as { role?: Role; status?: string };
  if (!meta.role) redirect("/onboarding");

  const sp = await searchParams;
  const saved = sp?.saved === "1";

  const email = u.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName =
    [u.firstName, u.lastName].filter(Boolean).join(" ") || email || "مستخدم";
  const avatarUrl = u.imageUrl || null;

  // اضمن وجود صف للمستخدم
  try {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, role: meta.role, fullName, email },
    });
  } catch {}

  let dbUser: {
    specialty: string | null;
    bio: string | null;
    consultationFee: number | null;
    phone: string | null;
  } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: u.id },
      select: {
        specialty: true,
        bio: true,
        consultationFee: true,
        phone: true,
      },
    });
  } catch {}

  const isProvider = PROVIDER_ROLES.includes(meta.role);
  const roleLabel = ROLE_LABELS[meta.role];

  // أقسام إضافية جاية في خطوات قادمة (موقوفة مؤقتًا — مفيش لينكات مكسورة)
  const sections = [
    {
      icon: Handshake,
      label: "الشراكات",
      desc: "الصيدليات والمعامل المرتبطة ونسب الخصم",
    },
    { icon: Mail, label: "الدعوات", desc: "دعوة أطباء ومقدمي خدمة للانضمام" },
    { icon: Activity, label: "السجل والأنشطة", desc: "كل الإجراءات والحركات" },
    {
      icon: MessageCircle,
      label: "الدعم والمساندة",
      desc: "تواصل مع فريق الدعم",
    },
    {
      icon: ShieldCheck,
      label: "السياسات والخصوصية",
      desc: "شروط الاستخدام وسياسة الدفع",
    },
  ];

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع للوحة
        </Link>
      </div>

      {/* الهيدر */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-l from-[#1fb2a3] to-[#178f83]" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                    {fullName.charAt(0)}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1fb2a3] text-white shadow">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
              <p className="text-sm text-slate-500">
                {roleLabel}
                {dbUser?.specialty ? " · " + dbUser.specialty : ""}
              </p>
            </div>
          </div>
          {email ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-4 w-4" />
              {email}
            </div>
          ) : null}
        </div>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم حفظ البروفايل بنجاح
        </div>
      )}

      {isProvider ? (
        <>
          {/* فورم الملف المهني */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              الملف المهني
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              البيانات دي بتظهر للمرضى في صفحتك وقت الحجز.
            </p>

            <form action={saveProfile} className="space-y-4">
              {/* الاسم (للعرض فقط) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  الاسم
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                  {fullName}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  لتغيير الاسم استخدم إعدادات الحساب.
                </p>
              </div>

              {/* التخصص — بحث/اختيار */}
              <div>
                <label
                  htmlFor="specialty"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  التخصص
                </label>
                <div className="relative">
                  <Stethoscope className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="specialty"
                    name="specialty"
                    list="specialty-options"
                    defaultValue={dbUser?.specialty ?? ""}
                    placeholder="ابحث واختار تخصصك"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                  <datalist id="specialty-options">
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* رقم الهاتف / واتساب */}
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
                    defaultValue={dbUser?.phone ?? ""}
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-left text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                </div>
              </div>

              {/* سعر الكشف */}
              <div>
                <label
                  htmlFor="consultationFee"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  سعر الكشف (ج.م)
                </label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="consultationFee"
                    name="consultationFee"
                    type="number"
                    min={0}
                    step={10}
                    defaultValue={dbUser?.consultationFee ?? ""}
                    placeholder={String(CONSULTATION_FEE)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  لو سيبته فاضي، هيتحسب السعر الافتراضي ({CONSULTATION_FEE}{" "}
                  ج.م).
                </p>
              </div>

              {/* نبذة */}
              <div>
                <label
                  htmlFor="bio"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  نبذة تعريفية
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    defaultValue={dbUser?.bio ?? ""}
                    placeholder="اكتب نبذة مختصرة عن خبرتك وخدماتك"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
              >
                حفظ البروفايل
              </button>
            </form>
          </div>

          {/* أقسام إضافية */}
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              إدارة الحساب
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 opacity-80"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {s.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          قريبًا
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          بياناتك الأساسية بتتسجّل تلقائيًا. البروفايل التفصيلي متاح لمقدمي
          الخدمة.
        </div>
      )}
    </div>
  );
}
