import { prisma } from "@life-id/db"

export type ProviderAppt = {
  id: string
  patientName: string
  scheduledAt: Date
  status: string
  priceEGP: number
}

export type ProviderData = {
  totalAppointments: number
  upcoming: number
  patientsCount: number
  revenue: number
  recent: ProviderAppt[]
}

export async function getProviderData(userId: string): Promise<ProviderData> {
  const empty: ProviderData = {
    totalAppointments: 0,
    upcoming: 0,
    patientsCount: 0,
    revenue: 0,
    recent: [],
  }
  try {
    const appts = await prisma.appointment.findMany({
      where: { providerId: userId },
      include: { patient: { select: { fullName: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    })
    const now = new Date()
    const patients = new Set<string>()
    let revenue = 0
    let upcoming = 0
    for (const a of appts) {
      patients.add(a.patientId)
      revenue += a.priceEGP - Math.round((a.priceEGP * a.discountPct) / 100)
      if (new Date(a.scheduledAt) >= now) upcoming++
    }
    const recent: ProviderAppt[] = appts.slice(0, 20).map((a) => ({
      id: a.id,
      patientName: a.patient?.fullName ?? "—",
      scheduledAt: new Date(a.scheduledAt),
      status: a.status,
      priceEGP: a.priceEGP,
    }))
    return {
      totalAppointments: appts.length,
      upcoming,
      patientsCount: patients.size,
      revenue,
      recent,
    }
  } catch {
    return empty
  }
}

export type PatientAppt = {
  id: string
  providerName: string
  scheduledAt: Date
  status: string
}

export type PatientData = {
  total: number
  upcoming: number
  providersCount: number
  recent: PatientAppt[]
}

export async function getPatientData(userId: string): Promise<PatientData> {
  const empty: PatientData = { total: 0, upcoming: 0, providersCount: 0, recent: [] }
  try {
    const appts = await prisma.appointment.findMany({
      where: { patientId: userId },
      include: { provider: { select: { fullName: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    })
    const now = new Date()
    const providers = new Set<string>()
    let upcoming = 0
    for (const a of appts) {
      providers.add(a.providerId)
      if (new Date(a.scheduledAt) >= now) upcoming++
    }
    const recent: PatientAppt[] = appts.slice(0, 20).map((a) => ({
      id: a.id,
      providerName: a.provider?.fullName ?? "—",
      scheduledAt: new Date(a.scheduledAt),
      status: a.status,
    }))
    return { total: appts.length, upcoming, providersCount: providers.size, recent }
  } catch {
    return empty
  }
}
