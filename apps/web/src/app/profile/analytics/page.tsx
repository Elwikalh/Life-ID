import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import {
  ArrowRight,
  BarChart3,
  Pill,
  Stethoscope,
  TrendingUp,
  FileText,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ");
}

export default async function AnalyticsPage() {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  const meta = u.publicMetadata as { role?: Role };
  if (meta.role !== "pharma_company") redirect("/profile");

  let products: Array<{ id: string; name: string }> = [];
  try {
    products = await prisma.pharmaProduct.findMany({
      where: { companyId: u.id },
      select: { id: true, name: true },
    });
  } catch {
    products = [];
  }

  const productMatchers = products.map((p) => ({
    name: p.name,
    norm: normalize(p.name),
  }));

  let prescriptions: Array<{
    id: string;
    doctorId: string;
    items: unknown;
    createdAt: Date;
  }> = [];
  try {
    prescriptions = await prisma.prescription.findMany({
      select: { id: true, doctorId: true, items: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    prescriptions = [];
  }

  const productCounts = new Map<string, number>();
  const doctorCounts = new Map<string, number>();
  let totalMatches = 0;

  for (const rx of prescriptions) {
    const items = Array.isArray(rx.items) ? rx.items : [];
    let matchedThisRx = false;
    for (const it of items) {
      const drug =
        it && typeof it === "object" && "drug" in it
          ? String((it as { drug?: unknown }).drug ?? "")
          : "";
      if (!drug) continue;
      const nd = normalize(drug);
      if (!nd) continue;
      for (const pm of productMatchers) {
        if (!pm.norm) continue;
        if (nd === pm.norm || nd.includes(pm.norm)) {
          productCounts.set(pm.name, (productCounts.get(pm.name) ?? 0) + 1);
          totalMatches++;
          matchedThisRx = true;
          break;
        }
      }
    }
    if (matchedThisRx) {
      doctorCounts.set(rx.doctorId, (doctorCounts.get(rx.doctorId) ?? 0) + 1);
    }
  }

  const doctorIds = [...doctorCounts.keys()];
  let doctors: Array<{
    id: string;
    fullName: string;
    specialty: string | null;
  }> = [];
  if (doctorIds.length > 0) {
    try {
      doctors = await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, fullName: true, specialty: true },
      });
    } catch {
      doctors = [];
    }
  }
  const doctorMap = new Map(doctors.map((d) => [d.id, d]));

  const productRanking = [...productCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const doctorRanking = [...doctorCounts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      name: doctorMap.get(id)?.fullName ?? "طبيب",
      specialty: doctorMap.get(id)?.specialty ?? null,
    }))
    .sort((a, b) => b.count - a.count);

  const maxProduct = productRanking[0]?.count ?? 0;
  const hasProducts = products.length > 0;

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
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            تحليلات الروشتات
          </h1>
          <p className="text-sm text-slate-500">
            مين الأطباء اللي وصفوا أدوية شركتك وأكتر منتج مطلوب.
          </p>
        </div>
      </div>

      {!hasProducts ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Pill className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="mb-4 text-sm text-slate-500">
            لازم تضيف أدوية في الكتالوج الأول عشان نقدر نتابع الروشتاتاللي فيها منتجاتك.
          </p>
          <Link
            href="/profile/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1fb2a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            <Pill className="h-4 w-4" />
            روح للكتالوج
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Pill className="h-4 w-4" />
                <span className="text-xs">أدوية في الكتالوج</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {products.length}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <span className="text-xs">مرات وصف أدويتك</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {totalMatches}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="h-4 w-4" />
                <span className="text-xs">أطباء وصفوها</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {doctorRanking.length}
              </div>
            </div>
          </div>

          {totalMatches === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              لسه مفيش روشتات فيها أدوية من كتالوجك. أول ما الأطباء
              يبدأوا يوصفوا منتجاتك، الأرقام هتظهر هنا تلقائيًا.
            </div>
          ) : (
            <>
              <div className="mt-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <TrendingUp className="h-5 w-5 text-[#1fb2a3]" />
                  الأدوية الأكتر وصفًا
                </h2>
                <div className="space-y-2">
                  {productRanking.map((p) => (
                    <div
                      key={p.name}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Pill className="h-4 w-4 text-[#1fb2a3]" />
                          {p.name}
                        </span>
                        <span className="text-sm font-bold text-[#0f766e]">
                          {p.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#1fb2a3]"
                          style={{
                            width:
                              (maxProduct > 0
                                ? Math.round((p.count / maxProduct) * 100)
                                : 0) + "%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Stethoscope className="h-5 w-5 text-[#1fb2a3]" />
                  الأطباء اللي وصفوا أدويتك
                </h2>
                <div className="space-y-3">
                  {doctorRanking.map((d, i) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1fb2a3]/10 text-sm font-bold text-[#0f766e]">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">
                          {d.name}
                        </div>
                        {d.specialty ? (
                          <div className="text-xs text-slate-500">
                            {d.specialty}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-[#0f766e]">
                          {d.count}
                        </div>
                        <div className="text-[10px] text-slate-400">روشتة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
