"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@life-id/db";

export async function addRep(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/profile/reps?error=name");

  const phone = String(formData.get("phone") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  try {
    await prisma.medicalRep.create({
      data: {
        companyId: u.id,
        name,
        phone: phone || null,
        region: region || null,
        note: note || null,
      },
    });
  } catch {}

  revalidatePath("/profile/reps");
  redirect("/profile/reps?saved=1");
}

export async function deleteRep(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/profile/reps");

  try {
    await prisma.medicalRep.deleteMany({ where: { id, companyId: u.id } });
  } catch {}

  revalidatePath("/profile/reps");
  redirect("/profile/reps?deleted=1");
}
