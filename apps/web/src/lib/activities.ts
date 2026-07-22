import { prisma } from "@life-id/db"
import type { Role } from "@life-id/types"

export type ActivityKind = "signup" | "appointment"

export type ActivityItem = {
  id: string
  kind: ActivityKind
  title: string
  subtitle: string
  role?: Role
  date: Date
}

export async function getRecentActivities(): Promise<ActivityItem[]> {
  const items: ActivityItem[] = []

  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    })
    for (const u of users) {
      items.push({
        id: "u_" + u.id,
        kind: "signup",
        title: u.fullName,
        subtitle: "مستخدم جديد",
        role: u.role as Role,
        date: new Date(u.createdAt),
      })
    }
  } catch {}

  try {
    const appts = await prisma.appointment.findMany({
      include: {
        patient: { select: { fullName: true } },
        provider: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    })
    for (const a of appts) {
      items.push({
        id: "a_" + a.id,
        kind: "appointment",
        title: (a.patient?.fullName ?? "—") + " ← " + (a.provider?.fullName ?? "—"),
        subtitle: "حجز جديد",
        date: new Date(a.createdAt),
      })
    }
  } catch {}

  items.sort((x, y) => y.date.getTime() - x.date.getTime())
  return items.slice(0, 40)
}
