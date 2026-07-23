"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSignIn, useAuth, useClerk } from "@clerk/nextjs"

const PASSWORD = "LifeId#Test2026"

type Role = {
  label: string
  email: string
  icon: string
  hint: string
}

const ROLES: Role[] = [
  {
    label: "طبيب — د. أحمد سمير",
    email: "doctor@lifeidapp.com",
    icon: "👨‍⚕️",
    hint: "لوحة مقدم خدمة + حجوزات",
  },
  {
    label: "عيادة — عيادة النور",
    email: "clinic@lifeidapp.com",
    icon: "🏥",
    hint: "لوحة مقدم خدمة",
  },
  {
    label: "مستشفى — مستشفى الحياة",
    email: "hospital@lifeidapp.com",
    icon: "🏨",
    hint: "لوحة مقدم خدمة",
  },
  {
    label: "صيدلية — صيدلية الشفاء",
    email: "pharmacy@lifeidapp.com",
    icon: "💊",
    hint: "حجوزات + توجيه روشتات",
  },
  {
    label: "معمل — معمل التحاليل الذكي",
    email: "lab@lifeidapp.com",
    icon: "🔬",
    hint: "حجوزات المعمل",
  },
  {
    label: "أشعة — مركز الأشعة الحديث",
    email: "radiology@lifeidapp.com",
    icon: "☢️",
    hint: "حجوزات الأشعة",
  },
  {
    label: "طوارئ — وحدة الطوارئ ٤٤٤",
    email: "emergency@lifeidapp.com",
    icon: "🚑",
    hint: "حجوزات الطوارئ",
  },
  {
    label: "شركة أدوية — شركة فارما",
    email: "pharma@lifeidapp.com",
    icon: "🏭",
    hint: "منتجات + مندوبين + شراكات",
  },
  {
    label: "مندوب — محمد علي",
    email: "rep@lifeidapp.com",
    icon: "🧑‍💼",
    hint: "لوحة المندوب + زياراته",
  },
  {
    label: "مريض — سارة عبد الله",
    email: "patient1@lifeidapp.com",
    icon: "🧑",
    hint: "حجوزات المريض",
  },
  {
    label: "مريض — خالد إبراهيم",
    email: "patient2@lifeidapp.com",
    icon: "🧑",
    hint: "حجوزات المريض",
  },
  {
    label: "مريض — منى حسن",
    email: "patient3@lifeidapp.com",
    icon: "🧑",
    hint: "حجوزات المريض",
  },
  {
    label: "مدير عام — المدير العام",
    email: "admin@lifeidapp.com",
    icon: "👨‍💼",
    hint: "لوحة الإدارة",
  },
]

export default function DevLoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loginAs(email: string) {
    if (!isLoaded || !signIn) return
    setError(null)
    setBusy(email)
    try {
      // لو داخل بحساب تاني، اعمل خروج الأول
      if (isSignedIn) {
        await signOut()
      }
      const res = await signIn.create({ identifier: email, password: PASSWORD })
      if (res.status === "complete" && setActive) {
        await setActive({ session: res.createdSessionId })
        router.push("/dashboard")
        return
      }
      setError("لم يكتمل الدخول (" + res.status + ")")
      setBusy(null)
    } catch (e) {
      const msg =
        e && typeof e === "object" && "errors" in e
          ? String(
              (e as { errors: Array<{ message?: string }> }).errors
                ?.map((x) => x.message)
                .join(" | "),
            )
          : e instanceof Error
            ? e.message
            : String(e)
      setError(msg)
      setBusy(null)
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            دخول سريع للتجربة
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            اضغط على أي دور للدخول فورًا من غير ما تكتب إيميل أو كلمة مرور.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ الصفحة دي للتجربة بس. احذفها قبل الإطلاق النهائي.
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLES.map((role) => {
            const isBusy = busy === role.email
            return (
              <button
                key={role.email}
                onClick={() => loginAs(role.email)}
                disabled={busy !== null || !isLoaded}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 text-right shadow-sm transition hover:border-brand-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-2xl">{role.icon}</span>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">
                    {role.label}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {role.hint}
                  </span>
                </span>
                <span className="text-sm font-medium text-brand-600">
                  {isBusy ? "جارٍ الدخول…" : "دخول ←"}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
