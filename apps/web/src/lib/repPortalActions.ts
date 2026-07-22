"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@life-id/db";

export async function linkRepAccount(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) redirect("/rep?error=empty");

  let outcome: "linked" | "already" | "invalid" | "error" = "error";
  try {
    const existing = await prisma.medicalRep.findFirst({
      where: { linkedUserId: u.id },
      select: { id: true },
    });
    if (existing) {
      outcome = "already";
    } else {
      const rep = await prisma.medicalRep.findFirst({
        where: { linkCode: code, linkedUserId: null },
        select: { id: true },
      });
      if (!rep) {
        outcome = "invalid";
      } else {
        await prisma.medicalRep.update({
          where: { id: rep.id },
          data: { linkedUserId: u.id },
        });
        outcome = "linked";
      }
    }
  } catch {
    outcome = "error";
  }

  revalidatePath("/rep");
  if (outcome === "already") redirect("/rep");
  if (outcome === "invalid") redirect("/rep?error=invalid");
  if (outcome === "error") redirect("/rep?error=server");
  redirect("/rep?linked=1");
}

export async function logVisit(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const doctorName = String(formData.get("doctorName") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const dateStr = String(formData.get("visitDate") ?? "").trim();

  if (!doctorName) redirect("/rep?error=doctor");

  let ok = false;
  try {
    const rep = await prisma.medicalRep.findFirst({
      where: { linkedUserId: u.id },
      select: { id: true },
    });
    if (rep) {
      const parsed = dateStr ? new Date(dateStr) : new Date();
      const visitDate = isNaN(parsed.getTime()) ? new Date() : parsed;
      await prisma.repVisit.create({
        data: {
          repId: rep.id,
          doctorName,
          specialty: specialty || null,
          region: region || null,
          outcome: outcome || null,
          note: note || null,
          visitDate,
        },
      });
      ok = true;
    }
  } catch {
    ok = false;
  }

  revalidatePath("/rep");
  if (!ok) redirect("/rep?error=visit");
  redirect("/rep?visit=1");
}

export async function deleteVisit(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/rep");

  try {
    const rep = await prisma.medicalRep.findFirst({
      where: { linkedUserId: u.id },
      select: { id: true },
    });
    if (rep) {
      await prisma.repVisit.deleteMany({
        where: { id, repId: rep.id },
      });
    }
  } catch {}

  revalidatePath("/rep");
  redirect("/rep?vdeleted=1");
}
