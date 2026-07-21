import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

export const dynamic = "force-dynamic"

export default async function DbCheckPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const email = user.emailAddresses?.[0]?.emailAddress ?? null
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || email || "مستخدم"

  let ok = false
  let total = 0
  let error = ""
  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, role: "patient", fullName, email }
    })
    total = await prisma.user.count()
    ok = true
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">فحص قاعدة البيانات</h1>
      {ok ? (
        <>
          <p className="mt-4 font-bold text-green-600">✅ الاتصال بقاعدة البيانات شغّال</p>
          <p className="mt-2 text-slate-500">
            عدد المستخدمين المسجّلين في قاعدة البيانات: <b>{total}</b>
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 font-bold text-red-600">❌ في مشكلة في الاتصال</p>
          <p className="mt-2 break-words text-sm text-slate-500">{error}</p>
        </>
      )}
    </main>
  )
}
