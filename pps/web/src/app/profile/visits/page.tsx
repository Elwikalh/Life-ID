import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import {
  ArrowRight,
  ClipboardList,
  Users,
  Stethoscope,
  MapPin,
  CalendarDays,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function CompanyVisitsPage() {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  const meta = u.publicMetadata as { role?: Role };
  if (meta.role !== "pharma_company") redirect("/profile");

  let visits: Array<{
    id: string;
    doctorName: string;
    specialty: string | null;
    region: string | null;
    outcome: string | null;
    note: string | null;
    visitDate: Date;
    rep: { name: string } | null;
  }> = [];
  try {
    visits = await prisma.repVisit.findMany({
      where: { rep: { companyId: u.id } },
      orderBy: { visitDate: "desc" },
      take: 300,
      select: {
        id: true,
        doctorName: true,
        specialty: true,
        region: true,
        outcome: true,
        note: true,
        visitDate: true,
        rep: { select: { name: true } },
      },
    });
  } catch {
    visits = [];
  }

  const now = new Date();
  const monthCount = visits.filter(
    (v) =>
      v.visitDate.getFullYear() === now.getFullYear() &&
      v.visitDate.getMonth() === now.getMonth(),
  ).length;
  const uniqueDoctors = new Set(
    visits.map((v) => v.doctorName.trim().toLowerCase()),
  ).size;

  const stats = [
    { icon: ClipboardList, label: "إجمالي الزيارات", value: visits.length },
    { icon: CalendarDays, label: "زيارات الشهر الحالي", value: monthCount },
    { icon: UserCheck, label: "أطباء تمت زيارتهم", value: uniqueDoctors },
  ];

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
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">زيارات المناديب</h1>
          <p className="text-sm text-slate-500">
            تابع زيارات مندوبيك للأطباء ونتائجها.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-xl font-bold text-slate-900">{s.value}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-slate-900">سجل الزيارات</h2>
        {visits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            لسه مفيش زيارات مسجّلة. أول ما مندوبيك يربطوا حساباتهم ويسجّلوا
            زيارات، هتظهر هنا.
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {v.doctorName}
                  </span>
                  {v.specialty ? (
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                      <Stethoscope className="h-3 w-3" />
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
                    <Users className="h-3.5 w-3.5 text-[#1fb2a3]" />
                    {v.rep?.name ?? "مندوب"}
                  </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
