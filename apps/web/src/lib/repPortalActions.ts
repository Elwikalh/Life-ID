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
