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

export type AdminUserDetail = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  role: Role
  createdAt: Date
  appointmentsCount: number
  providedCount: number
  medicalId: {
    qrCode: string
    bloodType: string | null
    allergies: string[]
    chronicConditions: string[]
    medications: string[]
    emergencyName: string | null
    emergencyPhone: string | null
  } | null
}

// جلب تفاصيل مستخدم واحد بالمعرّف
export async function getUserDetail(id: string): Promise<AdminUserDetail | null> {
  try {
    const u = await prisma.user.findUnique({
      where: { id },
      include: {
        medicalId: true,
        _count: { select: { appointments: true, provided: true } },
      },
    })
    if (!u) return null
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role as Role,
      createdAt: u.createdAt,
      appointmentsCount: u._count.appointments,
      providedCount: u._count.provided,
      medicalId: u.medicalId
        ? {
            qrCode: u.medicalId.qrCode,
            bloodType: u.medicalId.bloodType,
            allergies: u.medicalId.allergies,
            chronicConditions: u.medicalId.chronicConditions,
            medications: u.medicalId.medications,
            emergencyName: u.medicalId.emergencyName,
            emergencyPhone: u.medicalId.emergencyPhone,
          }
        : null,
    }
  } catch {
    return null
  }
}
