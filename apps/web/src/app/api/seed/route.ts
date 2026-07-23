import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@life-id/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// مفتاح بسيط لحماية الرابط — غيّره لو حبيت
const SEED_KEY = "lifeid-seed-2026"
const PASSWORD = "LifeId#Test2026"

type Extra = {
  specialty?: string
  city?: string
  consultationFee?: number
  branchesCount?: number
  clinicLocation?: string
  homeService?: boolean
  bio?: string
}

type Acc = {
  key: string
  role: string
  name: string
  email: string
  extra?: Extra
}

const ACCOUNTS: Acc[] = [
  {
    key: "doctor",
    role: "doctor",
    name: "د. أحمد سمير",
    email: "doctor@lifeid.test",
    extra: {
      specialty: "باطنة",
      city: "القاهرة",
      consultationFee: 250,
      clinicLocation: "مدينة نصر",
      bio: "استشاري باطنة وجهاز هضمي",
    },
  },
  {
    key: "clinic",
    role: "clinic",
    name: "عيادة النور",
    email: "clinic@lifeid.test",
    extra: { city: "الجيزة", branchesCount: 2 },
  },
  {
    key: "hospital",
    role: "hospital",
    name: "مستشفى الحياة",
    email: "hospital@lifeid.test",
    extra: { city: "القاهرة", branchesCount: 3 },
  },
  {
    key: "pharmacy",
    role: "pharmacy",
    name: "صيدلية الشفاء",
    email: "pharmacy@lifeid.test",
    extra: { city: "الإسكندرية", homeService: true },
  },
  {
    key: "lab",
    role: "lab",
    name: "معمل التحاليل الذكي",
    email: "lab@lifeid.test",
    extra: { city: "القاهرة" },
  },
  {
    key: "radiology",
    role: "radiology",
    name: "مركز الأشعة الحديث",
    email: "radiology@lifeid.test",
    extra: { city: "طنطا" },
  },
  {
    key: "emergency",
    role: "emergency",
    name: "وحدة الطوارئ ٤٤٤",
    email: "emergency@lifeid.test",
    extra: { city: "القاهرة" },
  },
  {
    key: "pharma",
    role: "pharma_company",
    name: "شركة فارما للأدوية",
    email: "pharma@lifeid.test",
    extra: { city: "القاهرة" },
  },
  {
    key: "rep",
    role: "medical_rep",
    name: "مندوب محمد علي",
    email: "rep@lifeid.test",
    extra: { city: "القاهرة" },
  },
  {
    key: "patient1",
    role: "patient",
    name: "سارة عبد الله",
    email: "patient1@lifeid.test",
  },
  {
    key: "patient2",
    role: "patient",
    name: "خالد إبراهيم",
    email: "patient2@lifeid.test",
  },
  {
    key: "patient3",
    role: "patient",
    name: "منى حسن",
    email: "patient3@lifeid.test",
  },
  {
    key: "superadmin",
    role: "super_admin",
    name: "المدير العام",
    email: "admin@lifeid.test",
  },
]

async function ensureUser(
  client: Awaited<ReturnType<typeof clerkClient>>,
  acc: Acc,
): Promise<string> {
  const publicMetadata = { role: acc.role, status: "approved" }
  const list = await client.users.getUserList({ emailAddress: [acc.email] })
  let id: string
  if (list.data.length > 0) {
    const existing = list.data[0]
    await client.users.updateUser(existing.id, {
      firstName: acc.name,
      publicMetadata,
    })
    id = existing.id
  } else {
    const created = await client.users.createUser({
      emailAddress: [acc.email],
      password: PASSWORD,
      firstName: acc.name,
      publicMetadata,
      skipPasswordChecks: true,
    })
    id = created.id
  }
  const data = {
    role: acc.role as never,
    fullName: acc.name,
    email: acc.email,
    ...(acc.extra ?? {}),
  }
  await prisma.user.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  })
  return id
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== SEED_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const client = await clerkClient()

    // 1) إنشاء / تحديث كل الحسابات
    const idMap: Record<string, string> = {}
    for (const acc of ACCOUNTS) {
      idMap[acc.key] = await ensureUser(client, acc)
    }

    const providerKeys = [
      "doctor",
      "clinic",
      "hospital",
      "pharmacy",
      "lab",
      "radiology",
      "emergency",
    ]
    const providerIds = providerKeys.map((k) => idMap[k])
    const patientIds = [idMap.patient1, idMap.patient2, idMap.patient3]
    const pharmaId = idMap.pharma
    const repUserId = idMap.rep

    // 2) تنظيف أي بيانات تجريبية قديمة (ليبقى الرابط قابل للتكرار)
    await prisma.appointment.deleteMany({
      where: { providerId: { in: providerIds } },
    })
    await prisma.medicalRep.deleteMany({ where: { companyId: pharmaId } })
    await prisma.pharmaProduct.deleteMany({ where: { companyId: pharmaId } })
    await prisma.partnership.deleteMany({ where: { ownerId: pharmaId } })

    // 3) حجوزات لكل مقدم خدمة
    const now = Date.now()
    const day = 86400000
    const statuses = ["pending", "confirmed", "completed", "cancelled"]
    const appts: {
      providerId: string
      patientId: string
      scheduledAt: Date
      status: string
      priceEGP: number
      discountPct: number
    }[] = []
    providerIds.forEach((pid, pi) => {
      for (let i = 0; i < 4; i++) {
        appts.push({
          providerId: pid,
          patientId: patientIds[(pi + i) % patientIds.length],
          scheduledAt: new Date(now + (i - 2) * day + pi * 3600000),
          status: statuses[i % statuses.length],
          priceEGP: 150 + i * 100,
          discountPct: i === 2 ? 10 : 0,
        })
      }
    })
    await prisma.appointment.createMany({ data: appts as never })

    // 4) منتجات شركة الأدوية
    await prisma.pharmaProduct.createMany({
      data: [
        {
          companyId: pharmaId,
          name: "باراسيتامول ٥٠٠",
          category: "مسكنات",
          dosageForm: "أقراص",
          price: 25,
        },
        {
          companyId: pharmaId,
          name: "أموكسيسيلين ٦٢٥",
          category: "مضادات حيوية",
          dosageForm: "كبسولات",
          price: 60,
        },
        {
          companyId: pharmaId,
          name: "فيتامين د ٥٠٠٠",
          category: "مكملات",
          dosageForm: "أقراص",
          price: 90,
        },
        {
          companyId: pharmaId,
          name: "شراب كحة",
          category: "جهاز تنفسي",
          dosageForm: "شراب",
          price: 45,
        },
      ] as never,
    })

    // 5) مندوبين (واحد مربوط بحساب المندوب)
    const repLinked = await prisma.medicalRep.create({
      data: {
        companyId: pharmaId,
        name: "مندوب محمد علي",
        region: "القاهرة",
        linkedUserId: repUserId,
      } as never,
    })
    const rep2 = await prisma.medicalRep.create({
      data: {
        companyId: pharmaId,
        name: "منى سعيد",
        region: "الجيزة",
      } as never,
    })
    const rep3 = await prisma.medicalRep.create({
      data: {
        companyId: pharmaId,
        name: "طارق فؤاد",
        region: "الإسكندرية",
      } as never,
    })

    // 6) زيارات المندوبين
    const docNames = ["د. سمير", "د. هبة", "د. علاء", "د. نورا"]
    const outcomes = ["تم التعاقد", "متابعة", "مهتم"]
    const visits: {
      repId: string
      doctorName: string
      region: string | null
      outcome: string
      visitDate: Date
    }[] = []
    ;[repLinked, rep2, rep3].forEach((rep, ri) => {
      for (let i = 0; i < 3; i++) {
        visits.push({
          repId: rep.id,
          doctorName: docNames[(ri + i) % docNames.length],
          region: rep.region ?? null,
          outcome: outcomes[(ri + i) % outcomes.length],
          visitDate: new Date(now - (i + 1) * day),
        })
      }
    })
    await prisma.repVisit.createMany({ data: visits as never })

    // 7) شراكات شركة الأدوية
    await prisma.partnership.createMany({
      data: [
        {
          ownerId: pharmaId,
          partnerName: "صيدلية الشفاء",
          partnerType: "صيدلية",
          discountPct: 15,
          patientPct: 10,
          doctorPct: 5,
        },
        {
          ownerId: pharmaId,
          partnerName: "معمل التحاليل الذكي",
          partnerType: "معمل",
          discountPct: 20,
          patientPct: 12,
          doctorPct: 8,
        },
      ] as never,
    })

    return NextResponse.json({
      ok: true,
      message: "تم إنشاء الحسابات والبيانات التجريبية بنجاح",
      password: PASSWORD,
      accounts: ACCOUNTS.map((a) => ({
        role: a.role,
        name: a.name,
        email: a.email,
      })),
      seeded: {
        appointments: appts.length,
        products: 4,
        reps: 3,
        visits: visits.length,
        partnerships: 2,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
