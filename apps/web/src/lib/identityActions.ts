"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@life-id/db"

const MAX_BYTES = 2 * 1024 * 1024 // 2 ميجابايت

type PhotoResult = string | null | "ERR_TYPE" | "ERR_SIZE"

async function fileToDataUrl(
  file: FormDataEntryValue | null,
): Promise<PhotoResult> {
  if (!(file instanceof File) || file.size === 0) return null
  if (!file.type.startsWith("image/")) return "ERR_TYPE"
  if (file.size > MAX_BYTES) return "ERR_SIZE"
  const buffer = Buffer.from(await file.arrayBuffer())
  return `data:${file.type};base64,${buffer.toString("base64")}`
}

export async function saveIdentity(formData: FormData) {
  const u = await currentUser()
  if (!u) redirect("/sign-in")

  const nationalId = String(formData.get("nationalId") ?? "").trim()
  if (!/^\d{6,20}$/.test(nationalId)) redirect("/id/verify?error=nid")

  const front = await fileToDataUrl(formData.get("front"))
  const back = await fileToDataUrl(formData.get("back"))
  if (front === "ERR_TYPE" || back === "ERR_TYPE")
    redirect("/id/verify?error=type")
  if (front === "ERR_SIZE" || back === "ERR_SIZE")
    redirect("/id/verify?error=size")

  const data: {
    nationalId: string
    idPhotoFrontUrl?: string
    idPhotoBackUrl?: string
  } = { nationalId }
  if (typeof front === "string") data.idPhotoFrontUrl = front
  if (typeof back === "string") data.idPhotoBackUrl = back

  try {
    await prisma.user.update({ where: { id: u.id }, data })
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "P2002") redirect("/id/verify?error=dup")
    redirect("/id/verify?error=fail")
  }

  revalidatePath("/id")
  revalidatePath("/id/verify")
  redirect("/id/verify?saved=1")
}
