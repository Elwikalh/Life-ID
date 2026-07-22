import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"

export const PROVIDER_ROLES: Role[] = [
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
]

// رسوم الكشف الافتراضية (قابلة للتخصيص لاحقًا)
export const CONSULTATION_FEE = 200

export type ProviderCard = { id: string; fullName: string; role: Role }

export async function searchProviders(q?: string, role?: string): Promise<ProviderCard[]> {
  try {
    const roleFilter =
      role && PROVIDER_ROLES.includes(role as Role) ? [role as Role] : PROVIDER_ROLES
    const rows = await prisma.user.findMany({
      where: {
        role: { in: roleFilter },
        ...(q && q.trim()
          ? { fullName: { contains: q.trim(), mode: "insensitive" as const } }
          : {}),
      },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: "asc" },
      take: 60,
    })
    return rows.map((r) => ({ id: r.id, fullName: r.fullName, role: r.role as Role }))
  } catch {
    return []
  }
}

export async function getProvider(id: string): Promise<ProviderCard | null> {
  try {
    const r = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, role: true },
    })
    if (!r || !PROVIDER_ROLES.includes(r.role as Role)) return null
    return { id: r.id, fullName: r.fullName, role: r.role as Role }
  } catch {
    return null
  }
}
