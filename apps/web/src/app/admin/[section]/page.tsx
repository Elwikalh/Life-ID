import { notFound } from "next/navigation"
import type { Role } from "@life-id/types"
import UsersListPage from "../_components/UsersListPage"

export const dynamic = "force-dynamic"

// كل أقسام القوائم تتولّد من هنا (راوت ديناميكي واحد)
const SECTIONS: Record<string, { title: string; roles: Role[] }> = {
  patients: { title: "المرضى", roles: ["patient"] },
  doctors: { title: "الأطباء", roles: ["doctor"] },
  hospitals: { title: "المستشفيات", roles: ["hospital"] },
  clinics: { title: "العيادات", roles: ["clinic"] },
  pharmacies: { title: "الصيدليات", roles: ["pharmacy"] },
  laboratories: { title: "المعامل", roles: ["lab"] },
  radiologies: { title: "مراكز الأشعة", roles: ["radiology"] },
  "pharma-companies": { title: "شركات الأدوية", roles: ["pharma_company"] },
  representatives: { title: "المندوبين", roles: ["medical_rep"] },
  admins: { title: "المديرين", roles: ["super_admin"] },
}

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { section } = await params
  const cfg = SECTIONS[section]
  if (!cfg) notFound()

  const { q } = await searchParams
  return (
    <UsersListPage
      title={cfg.title}
      roles={cfg.roles}
      query={q}
      basePath={"/admin/" + section}
    />
  )
}
