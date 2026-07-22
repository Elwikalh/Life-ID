import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@life-id/db"
import { uploadPhoto, removePhoto } from "../../../lib/imageActions"
import {
  ArrowRight,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export default async function PhotoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const sp = await searchParams
  const saved = sp.saved === "1"
  const removed = sp.removed === "1"
  const error = typeof sp.error === "string" ? sp.error : null

  let photo: { url: string } | null = null
  try {
    photo = await prisma.userPhoto.findUnique({
      where: { userId: u.id },
      select: { url: true },
    })
  } catch {
    photo = null
  }

  const errorText =
    error === "size"
      ? "حجم الصورة كبير — الحد الأقصى ٢ ميجابايت."
      : error === "type"
        ? "الملف المرفوع لازم يكون صورة."
        : error === "empty"
          ? "من فضلك اختر صورة أولاً."
          : null

  return (
    <main dir="rtl" className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للملف الشخصي
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1fb2a3]/10 text-[#0f766e]">
          <Camera className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            الصورة الشخصية / اللوجو
          </h1>
          <p className="text-sm text-gray-500">
            ارفع صورتك أو شعار مكانك — بتظهر في ملفك الشخصي.
          </p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#1fb2a3]/10 px-4 py-3 text-sm text-[#0f766e]">
          <CheckCircle2 className="h-5 w-5" />
          تم حفظ الصورة بنجاح.
        </div>
      )}
      {removed && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
          <CheckCircle2 className="h-5 w-5" />
          تم حذف الصورة.
        </div>
      )}
      {errorText && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-5 w-5" />
          {errorText}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-[#1fb2a3]/20 bg-gray-50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.url}
                alt="الصورة الحالية"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-12 w-12 text-gray-300" />
            )}
          </div>
          <p className="text-sm text-gray-500">
            {photo ? "الصورة الحالية" : "لا توجد صورة بعد"}
          </p>
        </div>

        <form action={uploadPhoto} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              اختر صورة (JPG أو PNG — بحد أقصى ٢ ميجابايت)
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="block w-full text-sm text-gray-600 file:ml-3 file:rounded-lg file:border-0 file:bg-[#1fb2a3] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#178f83]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1fb2a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#178f83]"
          >
            <Upload className="h-4 w-4" />
            رفع الصورة
          </button>
        </form>

        {photo && (
          <form action={removePhoto} className="mt-3">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              حذف الصورة
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
