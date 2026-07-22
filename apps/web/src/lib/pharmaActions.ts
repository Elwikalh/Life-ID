"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@life-id/db";

export async function addProduct(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/profile/products?error=name");

  const category = String(formData.get("category") ?? "").trim();
  const dosageForm = String(formData.get("dosageForm") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const priceNum = priceRaw ? Number(priceRaw) : null;
  const price =
    priceNum !== null && Number.isFinite(priceNum)
      ? Math.max(0, Math.round(priceNum))
      : null;

  try {
    await prisma.pharmaProduct.create({
      data: {
        companyId: u.id,
        name,
        category: category || null,
        dosageForm: dosageForm || null,
        price,
        note: note || null,
      },
    });
  } catch {}

  revalidatePath("/profile/products");
  redirect("/profile/products?saved=1");
}

export async function deleteProduct(formData: FormData) {
  const u = await currentUser();
  if (!u) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/profile/products");

  try {
    await prisma.pharmaProduct.deleteMany({ where: { id, companyId: u.id } });
  } catch {}

  revalidatePath("/profile/products");
  redirect("/profile/products?deleted=1");
}
