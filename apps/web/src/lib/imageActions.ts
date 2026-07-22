"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

const MAX_BYTES = 2 * 1024 * 1024 // 2 ميجابايت

export async function uploadPhoto(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const file = formData.get("photo")
  if (!(file instanceof File) || file.size === 0) {
    redirect("/profile/photo?error=empty")
  }
  if (!file.type.startsWith("image/")) {
    redirect("/profile/photo?error=type")
  }
  if (file.size > MAX_BYTES) {
    redirect("/profile/photo?error=size")
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`

    await prisma.userPhoto.upsert({
      where: { userId: u.id },
      update: { url: dataUrl },
      create: { userId: u.id, url: dataUrl },
    })
  } catch {}

  revalidatePath("/profile/photo")
  revalidatePath("/profile")
  redirect("/profile/photo?saved=1")
}

export async function removePhoto() {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  try {
    await prisma.userPhoto.deleteMany({ where: { userId: u.id } })
  } catch {}

  revalidatePath("/profile/photo")
  revalidatePath("/profile")
  redirect("/profile/photo?removed=1")
}
