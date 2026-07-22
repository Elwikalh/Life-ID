import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"

export type AdminUserRow = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  createdAt: Date
}

// جلب المستخدمين حسب الدور (مع بحث اختياري)
export async function listUsersByRole(
  roles: Role[],
  query?: string
): Promise<AdminUserRow[]> {
  try {
    const q = query?.trim()
    return await prisma.user.findMany({
      where: {
        role: { in: roles },
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  } catch {
    return []
  }
}
