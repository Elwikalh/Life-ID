"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import {
  savePayoutDetails,
  requestPayout,
  confirmPayoutReceived,
} from "./wallet"

function clean(v: FormDataEntryValue | null) {
  const s = String(v || "").trim()
  return s || null
}

// حفظ بيانات استقبال أموال الطبيب
export async function savePayoutDetailsAction(formData: FormData) {
  const u = await currentUser()
  if (!u) return
  await savePayoutDetails(u.id, {
    payoutName: clean(formData.get("payoutName")),
    payoutInstapay: clean(formData.get("payoutInstapay")),
    payoutMobile: clean(formData.get("payoutMobile")),
    payoutBank: clean(formData.get("payoutBank")),
    payoutAccount: clean(formData.get("payoutAccount")),
    payoutNote: clean(formData.get("payoutNote")),
  })
  revalidatePath("/profile/wallet")
}

// الدكتور يطلب صرف مستحقاته من شريك
export async function requestPayoutAction(formData: FormData) {
  const u = await currentUser()
  if (!u) return
  const partnerId = String(formData.get("partnerId") || "")
  if (!partnerId) return
  await requestPayout(u.id, partnerId)
  revalidatePath("/profile/wallet")
}

// الدكتور يؤكّد استلام المبلغ
export async function confirmPayoutReceivedAction(formData: FormData) {
  const u = await currentUser()
  if (!u) return
  const payoutId = String(formData.get("payoutId") || "")
  if (!payoutId) return
  await confirmPayoutReceived(payoutId, u.id)
  revalidatePath("/profile/wallet")
}
