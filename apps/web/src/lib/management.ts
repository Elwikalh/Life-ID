import { prisma } from "@life-id/db"
import { ROLE_LABELS } from "./roles"
import type { Role } from "@life-id/types"

export type ManagementData = {
  dbConnected: boolean
  totalUsers: number
  roleDistribution: Array<{ role: Role; label: string; count: number }>
}

const ALL_ROLES: Role[] = [
  "patient",
  "doctor",
  "clinic",
  "pharmacy",
  "lab",
  "radiology",
  "hospital",
  "pharma_company",
  "medical_rep",
  "emergency",
  "super_admin",
]

export async function getManagementData(): Promise<ManagementData> {
  let dbConnected = false
  let totalUsers = 0
  const counts: Record<string, number> = {}

  try {
    const byRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } })
    for (const r of byRole) counts[r.role as string] = r._count._all
    totalUsers = await prisma.user.count()
    dbConnected = true
  } catch {}

  const roleDistribution = ALL_ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    count: counts[role] ?? 0,
  }))

  return { dbConnected, totalUsers, roleDistribution }
}
