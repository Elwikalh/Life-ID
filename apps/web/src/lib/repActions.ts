"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@life-id/db";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = "";
  for (let i = 0; i < 6; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

async function uniqueCode(): Promise<string | null> {
  for (let i = 0; i < 6; i++) {
    const c = genCode();
    const exists = await prisma.medicalRep.findFirst({
      where: { linkCode: c },
      select: { id: true },
    });
    if (!exists) return c;
  }
  return null;
}

export async function addRep(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/profile/reps?error=name");

  const phone = String(formData.get("phone") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  try {
    const linkCode = await uniqueCode();
    await prisma.medicalRep.create({
      data: {
        companyId: u.id,
        name,
        phone: phone || null,
        region: region || null,
        note: note || null,
        linkCode,
      },
    });
  } catch {}

  revalidatePath("/profile/reps");
  redirect("/profile/reps?saved=1");
}

export async function generateLinkCode(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/profile/reps");

  try {
    const rep = await prisma.medicalRep.findFirst({
      where: { id, companyId: u.id },
      select: { id: true },
    });
    if (rep) {
      const code = await uniqueCode();
      if (code) {
        await prisma.medicalRep.update({
          where: { id },
          data: { linkCode: code },
        });
      }
    }
  } catch {}

  revalidatePath("/profile/reps");
  redirect("/profile/reps");
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
