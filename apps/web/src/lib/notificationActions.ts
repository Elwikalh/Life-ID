"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

// تحديد كل الإشعارات كمقروءة
export async function markAllNotificationsRead() {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  try {
    await prisma.notification.updateMany({
      where: { userId: u.id, read: false },
      data: { read: true },
    })
  } catch {}
  revalidatePath("/notifications")
  redirect("/notifications")
}

// تحديد إشعار واحد كمقروء
export async function markNotificationRead(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")
  const id = String(formData.get("id") || "").trim()
  if (id) {
    try {
      await prisma.notification.updateMany({
        where: { id, userId: u.id },
        data: { read: true },
      })
    } catch {}
  }
  revalidatePath("/notifications")
  redirect("/notifications")
}
