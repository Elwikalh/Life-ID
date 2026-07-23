import { prisma } from "@life-id/db"

export type ProviderRating = { avg: number; count: number }

export type ReviewRow = {
  id: string
  providerId: string
  patientId: string
  patientName: string | null
  rating: number
  comment: string | null
  createdAt: Date
}

export async function getProviderRating(
  providerId: string,
): Promise<ProviderRating> {
  try {
    const agg = await prisma.review.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: { rating: true },
    })
    return {
      avg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      count: agg._count.rating ?? 0,
    }
  } catch {
    return { avg: 0, count: 0 }
  }
}

export async function getRatingsMap(
  providerIds: string[],
): Promise<Record<string, ProviderRating>> {
  const map: Record<string, ProviderRating> = {}
  if (providerIds.length === 0) return map
  try {
    const rows = await prisma.review.groupBy({
      by: ["providerId"],
      where: { providerId: { in: providerIds } },
      _avg: { rating: true },
      _count: { rating: true },
    })
    for (const r of rows) {
      map[r.providerId] = {
        avg: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : 0,
        count: r._count.rating ?? 0,
      }
    }
  } catch {}
  return map
}

export async function getProviderReviews(
  providerId: string,
  limit = 20,
): Promise<ReviewRow[]> {
  try {
    return await prisma.review.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  } catch {
    return []
  }
}

export type ReviewableProvider = {
  providerId: string
  providerName: string
  role: string
  lastVisit: Date
  myReview: ReviewRow | null
}

export async function getReviewables(
  patientId: string,
): Promise<ReviewableProvider[]> {
  try {
    const appts = await prisma.appointment.findMany({
      where: { patientId, status: "completed" },
      orderBy: { scheduledAt: "desc" },
      include: { provider: { select: { fullName: true, role: true } } },
    })
    const seen = new Map<string, ReviewableProvider>()
    for (const a of appts) {
      if (!a.providerId || seen.has(a.providerId)) continue
      seen.set(a.providerId, {
        providerId: a.providerId,
        providerName: a.provider?.fullName ?? "—",
        role: a.provider?.role ?? "",
        lastVisit: a.scheduledAt,
        myReview: null,
      })
    }
    const ids = [...seen.keys()]
    if (ids.length > 0) {
      const mine = await prisma.review.findMany({
        where: { patientId, providerId: { in: ids } },
      })
      for (const r of mine) {
        const entry = seen.get(r.providerId)
        if (entry) entry.myReview = r
      }
    }
    return [...seen.values()]
  } catch {
    return []
  }
}
