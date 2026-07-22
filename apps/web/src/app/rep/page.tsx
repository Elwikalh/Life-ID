import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import { linkRepAccount } from "../../lib/repPortalActions";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

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
            اربط حسابك بشركتك وابدأ شغلك كمندوب دعاية طبية.
          </p>
        </div>
      </div>

      {linked && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم ربط حسابك بالشركة بنجاح.
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
      {error === "server" && (
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
            <div className="space-y-3 p-6">
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

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 opacity-70">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  تسجيل الزيارات
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  قريبًا
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                سجّل زياراتك للأطباء وتابع نتائجها.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
