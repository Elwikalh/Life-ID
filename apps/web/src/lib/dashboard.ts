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
  const empty: PatientData = {
    total: 0,
    upcoming: 0,
    providersCount: 0,
    recent: [],
  }
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
    return {
      total: appts.length,
      upcoming,
      providersCount: providers.size,
      recent,
    }
  } catch {
    return empty
  }
}

// ===== لوحة شركة الأدوية =====
export type PharmaProductLite = {
  id: string
  name: string
  category: string | null
  price: number | null
}

export type PharmaRepLite = {
  id: string
  name: string
  region: string | null
  visits: number
}

export type PharmaVisitLite = {
  id: string
  doctorName: string
  region: string | null
  outcome: string | null
  visitDate: Date
}

export type PharmaData = {
  productsCount: number
  repsCount: number
  visitsCount: number
  partnershipsCount: number
  recentProducts: PharmaProductLite[]
  topReps: PharmaRepLite[]
  recentVisits: PharmaVisitLite[]
}

export async function getPharmaData(companyId: string): Promise<PharmaData> {
  const empty: PharmaData = {
    productsCount: 0,
    repsCount: 0,
    visitsCount: 0,
    partnershipsCount: 0,
    recentProducts: [],
    topReps: [],
    recentVisits: [],
  }
  try {
    const [
      productsCount,
      repsCount,
      visitsCount,
      partnershipsCount,
      productRows,
      repRows,
      visitRows,
    ] = await Promise.all([
      prisma.pharmaProduct.count({ where: { companyId } }),
      prisma.medicalRep.count({ where: { companyId } }),
      prisma.repVisit.count({ where: { rep: { companyId } } }),
      prisma.partnership.count({ where: { ownerId: companyId } }),
      prisma.pharmaProduct.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, category: true, price: true },
      }),
      prisma.medicalRep.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          region: true,
          _count: { select: { visits: true } },
        },
      }),
      prisma.repVisit.findMany({
        where: { rep: { companyId } },
        orderBy: { visitDate: "desc" },
        take: 6,
        select: {
          id: true,
          doctorName: true,
          region: true,
          outcome: true,
          visitDate: true,
        },
      }),
    ])

    return {
      productsCount,
      repsCount,
      visitsCount,
      partnershipsCount,
      recentProducts: productRows.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category ?? null,
        price: p.price ?? null,
      })),
      topReps: repRows.map((r) => ({
        id: r.id,
        name: r.name,
        region: r.region ?? null,
        visits: r._count.visits,
      })),
      recentVisits: visitRows.map((v) => ({
        id: v.id,
        doctorName: v.doctorName,
        region: v.region ?? null,
        outcome: v.outcome ?? null,
        visitDate: new Date(v.visitDate),
      })),
    }
  } catch {
    return empty
  }
}

// ===== لوحة المندوب الطبي =====
export type RepVisitLite = {
  id: string
  doctorName: string
  region: string | null
  outcome: string | null
  visitDate: Date
}

export type RepSelfData = {
  linked: boolean
  companyName: string | null
  region: string | null
  visitsCount: number
  recentVisits: RepVisitLite[]
}

export async function getRepSelfData(userId: string): Promise<RepSelfData> {
  const empty: RepSelfData = {
    linked: false,
    companyName: null,
    region: null,
    visitsCount: 0,
    recentVisits: [],
  }
  try {
    const rep = await prisma.medicalRep.findFirst({
      where: { linkedUserId: userId },
      select: {
        region: true,
        company: { select: { fullName: true } },
        _count: { select: { visits: true } },
        visits: {
          orderBy: { visitDate: "desc" },
          take: 6,
          select: {
            id: true,
            doctorName: true,
            region: true,
            outcome: true,
            visitDate: true,
          },
        },
      },
    })
    if (!rep) return empty
    return {
      linked: true,
      companyName: rep.company?.fullName ?? null,
      region: rep.region ?? null,
      visitsCount: rep._count.visits,
      recentVisits: rep.visits.map((v) => ({
        id: v.id,
        doctorName: v.doctorName,
        region: v.region ?? null,
        outcome: v.outcome ?? null,
        visitDate: new Date(v.visitDate),
      })),
    }
  } catch {
    return empty
  }
}
