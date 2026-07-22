import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Role } from "@life-id/types";
import { prisma } from "@life-id/db";
import { addProduct, deleteProduct } from "../../../lib/pharmaActions";
import {
  ArrowRight,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "مضاد حيوي",
  "مسكّن وخافض حرارة",
  "مضاد التهاب",
  "أدوية القلب والضغط",
  "أدوية السكر",
  "جهاز هضمي",
  "جهاز تنفسي",
  "فيتامينات ومكملات",
  "جلدية",
  "أعصاب ونفسية",
  "هرمونات",
  "أخرى",
];

const DOSAGE_FORMS = [
  "أقراص",
  "كبسولات",
  "شراب",
  "حقن",
  "مرهم/كريم",
  "قطرة",
  "لبوس",
  "بخاخ",
];

export default async function ProductsPage({
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

  let products: Array<{
    id: string;
    name: string;
    category: string | null;
    dosageForm: string | null;
    price: number | null;
    note: string | null;
  }> = [];
  try {
    products = await prisma.pharmaProduct.findMany({
      where: { companyId: u.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        dosageForm: true,
        price: true,
        note: true,
      },
    });
  } catch {
    products = [];
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
          <Pill className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">كتالوج الأدوية</h1>
          <p className="text-sm text-slate-500">
            سجّل أدوية شركتك ومنتجاتها عشان نقدر نتابعها في الروشتات لاحقًا.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
          <Package className="h-5 w-5" />
        </span>
        <div>
          <div className="text-2xl font-bold text-slate-900">
            {products.length}
          </div>
          <div className="text-xs text-slate-500">منتج مسجّل</div>
        </div>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#1fb2a3]/30 bg-[#1fb2a3]/10 px-4 py-3 text-sm font-medium text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          تم إضافة المنتج بنجاح.
        </div>
      )}
      {deleted && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4" />
          تم حذف المنتج.
        </div>
      )}
      {error === "name" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          من فضلك اكتب اسم المنتج.
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">إضافة منتج</h2>
        <form action={addProduct} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              اسم الدواء / المنتج
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="مثال: أموكسيسيلين 500"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                التصنيف
              </label>
              <input
                id="category"
                name="category"
                list="category-options"
                placeholder="اختر أو اكتب"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
              />
              <datalist id="category-options">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="dosageForm"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                الشكل الدوائي
              </label>
              <select
                id="dosageForm"
                name="dosageForm"
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
              >
                <option value="">— اختر —</option>
                {DOSAGE_FORMS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="price"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              السعر (ج.م) — اختياري
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1}
              placeholder="مثال: 75"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
            />
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
              placeholder="أي تفاصيل إضافية عن المنتج"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#1fb2a3] focus:ring-2 focus:ring-[#1fb2a3]/20"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fb2a3] py-3 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            <Plus className="h-4 w-4" />
            إضافة المنتج
          </button>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          المنتجات المسجّلة
        </h2>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            لسه مفيش منتجات — ابدأ بإضافة أول دواء من الفورم فوق.
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#1fb2a3]">
                  <Pill className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {p.name}
                    </span>
                    {p.category ? (
                      <span className="rounded-full bg-[#1fb2a3]/10 px-2 py-0.5 text-[10px] font-medium text-[#0f766e]">
                        {p.category}
                      </span>
                    ) : null}
                    {p.dosageForm ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {p.dosageForm}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {p.price !== null ? <span>{p.price} ج.م</span> : null}
                    {p.note ? <span>{p.note}</span> : null}
                  </div>
                </div>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={p.id} />
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
