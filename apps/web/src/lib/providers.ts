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

// رسوم الكشف الافتراضية (لو مقدم الخدمة لم يحدّد سعرًا)
export const CONSULTATION_FEE = 200

export type ProviderCard = {
  id: string
  fullName: string
  role: Role
  specialty: string | null
  consultationFee: number | null
  bio: string | null
  city: string | null
  workingDays: string[]
  workFrom: string | null
  workTo: string | null
  homeService: boolean
}

const SELECT = {
  id: true,
  fullName: true,
  role: true,
  specialty: true,
  consultationFee: true,
  bio: true,
  city: true,
  workingDays: true,
  workFrom: true,
  workTo: true,
  homeService: true,
} as const

type ProviderRow = {
  id: string
  fullName: string
  role: string
  specialty: string | null
  consultationFee: number | null
  bio: string | null
  city: string | null
  workingDays: string[]
  workFrom: string | null
  workTo: string | null
  homeService: boolean
}

function toCard(r: ProviderRow): ProviderCard {
  return {
    id: r.id,
    fullName: r.fullName,
    role: r.role as Role,
    specialty: r.specialty ?? null,
    consultationFee: r.consultationFee ?? null,
    bio: r.bio ?? null,
    city: r.city ?? null,
    workingDays: r.workingDays ?? [],
    workFrom: r.workFrom ?? null,
    workTo: r.workTo ?? null,
    homeService: r.homeService ?? false,
  }
}

export async function searchProviders(
  q?: string,
  role?: string,
): Promise<ProviderCard[]> {
  try {
    const roleFilter =
      role && PROVIDER_ROLES.includes(role as Role)
        ? [role as Role]
        : PROVIDER_ROLES
    const rows = await prisma.user.findMany({
      where: {
        role: { in: roleFilter },
        ...(q && q.trim()
          ? { fullName: { contains: q.trim(), mode: "insensitive" as const } }
          : {}),
      },
      select: SELECT,
      orderBy: { fullName: "asc" },
      take: 60,
    })
    return rows.map(toCard)
  } catch {
    return []
  }
}

export async function getProvider(id: string): Promise<ProviderCard | null> {
  try {
    const r = await prisma.user.findUnique({ where: { id }, select: SELECT })
    if (!r || !PROVIDER_ROLES.includes(r.role as Role)) return null
    return toCard(r)
  } catch {
    return null
  }
}
