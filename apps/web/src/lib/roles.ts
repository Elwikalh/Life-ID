import type { Role } from "@life-id/types"

// الأسماء العربية لكل دور
export const ROLE_LABELS: Record<Role, string> = {
  patient: "مريض",
  doctor: "طبيب",
  clinic: "عيادة",
  pharmacy: "صيدلية",
  lab: "معمل تحاليل",
  radiology: "مركز أشعة",
  hospital: "مستشفى",
  pharma_company: "شركة أدوية",
  medical_rep: "مندوب دعاية طبية",
  emergency: "طوارئ",
  super_admin: "مدير النظام"
}

export type RoleInfo = { value: Role; labelAr: string; descAr: string }

// الأدوار اللي المستخدم يقدر يختارها بنفسه (من غير مدير النظام)
export const SELECTABLE_ROLES: RoleInfo[] = [
  { value: "patient", labelAr: "مريض", descAr: "ملفي الطبي وحجوزاتي وبطاقة الطوارئ" },
  { value: "doctor", labelAr: "طبيب", descAr: "استقبال الحجوزات وكتابة الروشتات" },
  { value: "clinic", labelAr: "عيادة", descAr: "إدارة عيادة وأطباء ومواعيد" },
  { value: "pharmacy", labelAr: "صيدلية", descAr: "صرف الروشتات والخصومات" },
  { value: "lab", labelAr: "معمل تحاليل", descAr: "استقبال طلبات التحاليل ونتائجها" },
  { value: "radiology", labelAr: "مركز أشعة", descAr: "استقبال طلبات الأشعة ونتائجها" },
  { value: "hospital", labelAr: "مستشفى", descAr: "إدارة أقسام وأطباء وطوارئ" },
  { value: "pharma_company", labelAr: "شركة أدوية", descAr: "إدارة المنتجات والمندوبين" },
  { value: "medical_rep", labelAr: "مندوب دعاية طبية", descAr: "زيارات الأطباء والتقارير" },
  { value: "emergency", labelAr: "طوارئ", descAr: "الوصول لبيانات الطوارئ للمرضى" }
]
