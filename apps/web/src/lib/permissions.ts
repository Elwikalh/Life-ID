// كتالوج الصلاحيات — مستويين: صلاحيات مقدّم الخدمة (موظفين) + صلاحيات منصة (أدمن عام)

export type Bi = { ar: string; en: string }

export type PermissionDef = { key: string; label: Bi }
export type PermissionGroup = { title: Bi; permissions: PermissionDef[] }

// ---------- صلاحيات موظفي مقدّم الخدمة (عيادة/مستشفى/صيدلية/معمل/أشعة...) ----------
export const PROVIDER_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: { ar: "المرضى والحالات", en: "Patients & cases" },
    permissions: [
      {
        key: "patients.search",
        label: { ar: "البحث عن المرضى", en: "Search patients" },
      },
      {
        key: "patients.register",
        label: { ar: "تسجيل مريض جديد", en: "Register new patient" },
      },
      {
        key: "patients.view_profile",
        label: { ar: "عرض ملف المريض", en: "View patient profile" },
      },
      {
        key: "cases.open",
        label: { ar: "فتح حالة / حجز", en: "Open case / booking" },
      },
    ],
  },
  {
    title: { ar: "الروشتات والطلبات", en: "Prescriptions & orders" },
    permissions: [
      {
        key: "rx.create",
        label: { ar: "إنشاء روشتة", en: "Create prescription" },
      },
      {
        key: "orders.lab",
        label: { ar: "طلب تحاليل", en: "Request lab tests" },
      },
      {
        key: "orders.imaging",
        label: { ar: "طلب أشعة", en: "Request imaging" },
      },
      {
        key: "results.view",
        label: { ar: "عرض النتائج", en: "View results" },
      },
      {
        key: "results.upload",
        label: { ar: "رفع النتائج", en: "Upload results" },
      },
    ],
  },
  {
    title: { ar: "الطلبات الواردة", en: "Incoming requests" },
    permissions: [
      {
        key: "requests.view",
        label: { ar: "عرض الطلبات", en: "View requests" },
      },
      {
        key: "requests.decide",
        label: { ar: "قبول / رفض الطلبات", en: "Accept / reject requests" },
      },
    ],
  },
  {
    title: { ar: "المنتجات والخدمات", en: "Products & services" },
    permissions: [
      {
        key: "catalog.view",
        label: { ar: "عرض المنتجات/الخدمات", en: "View products/services" },
      },
      {
        key: "catalog.manage",
        label: { ar: "إدارة المنتجات/الخدمات", en: "Manage products/services" },
      },
      {
        key: "offers.manage",
        label: { ar: "إدارة العروض والخصومات", en: "Manage price offers" },
      },
    ],
  },
  {
    title: { ar: "الفروع والموظفين", en: "Branches & staff" },
    permissions: [
      {
        key: "branches.view",
        label: { ar: "عرض الفروع", en: "View branches" },
      },
      {
        key: "branches.manage",
        label: { ar: "إدارة الفروع", en: "Manage branches" },
      },
      {
        key: "staff.view",
        label: { ar: "عرض الموظفين", en: "View staff" },
      },
      {
        key: "staff.manage",
        label: { ar: "إضافة/إدارة الموظفين", en: "Add / manage staff" },
      },
    ],
  },
  {
    title: { ar: "المالية", en: "Finance" },
    permissions: [
      {
        key: "finance.view",
        label: { ar: "عرض المالية والمحفظة", en: "View finance & wallet" },
      },
      {
        key: "partnerships.manage",
        label: { ar: "إدارة الشراكات", en: "Manage partnerships" },
      },
      {
        key: "profile.manage",
        label: { ar: "إدارة ملف مقدّم الخدمة", en: "Manage provider profile" },
      },
    ],
  },
]

// ---------- صلاحيات أدمن المنصة (مولّدة من كيانات × إجراءات) ----------
type PlatformEntity = { key: string; label: Bi }

const PLATFORM_ENTITIES: PlatformEntity[] = [
  { key: "patients", label: { ar: "المرضى", en: "Patients" } },
  { key: "doctors", label: { ar: "الأطباء", en: "Doctors" } },
  { key: "clinics", label: { ar: "العيادات", en: "Clinics" } },
  { key: "hospitals", label: { ar: "المستشفيات", en: "Hospitals" } },
  { key: "pharmacies", label: { ar: "الصيدليات", en: "Pharmacies" } },
  { key: "labs", label: { ar: "المعامل", en: "Laboratories" } },
  { key: "radiology", label: { ar: "مراكز الأشعة", en: "Radiology centers" } },
  { key: "pharma", label: { ar: "شركات الأدوية", en: "Pharma companies" } },
  { key: "reps", label: { ar: "المندوبين", en: "Representatives" } },
  { key: "partners", label: { ar: "الشركاء", en: "Partners" } },
  { key: "medicines", label: { ar: "الأدوية", en: "Medicines" } },
  { key: "admins", label: { ar: "الأدمن", en: "Admins" } },
]

const PLATFORM_ACTIONS: { suffix: string; label: (e: Bi) => Bi }[] = [
  {
    suffix: "view_list",
    label: (e) => ({ ar: `عرض قائمة ${e.ar}`, en: `Show ${e.en} list` }),
  },
  {
    suffix: "view_details",
    label: (e) => ({ ar: `عرض تفاصيل ${e.ar}`, en: `Show ${e.en} details` }),
  },
  {
    suffix: "create",
    label: (e) => ({ ar: `إضافة ${e.ar}`, en: `Add ${e.en}` }),
  },
  {
    suffix: "update",
    label: (e) => ({ ar: `تعديل ${e.ar}`, en: `Update ${e.en}` }),
  },
  {
    suffix: "delete",
    label: (e) => ({ ar: `حذف ${e.ar}`, en: `Delete ${e.en}` }),
  },
]

function buildEntityGroup(entity: PlatformEntity): PermissionGroup {
  return {
    title: entity.label,
    permissions: PLATFORM_ACTIONS.map((a) => ({
      key: `${entity.key}.${a.suffix}`,
      label: a.label(entity.label),
    })),
  }
}

const PLATFORM_GENERAL_GROUP: PermissionGroup = {
  title: { ar: "عام والنظام", en: "General & system" },
  permissions: [
    {
      key: "app.manage",
      label: { ar: "إدارة التطبيق", en: "Manage app" },
    },
    {
      key: "website.manage",
      label: { ar: "إدارة الموقع", en: "Manage website" },
    },
    {
      key: "charts.view",
      label: { ar: "عرض الإحصائيات", en: "Show charts" },
    },
    {
      key: "finance.department",
      label: { ar: "الإدارة المالية", en: "Finance department" },
    },
    {
      key: "requests.decide",
      label: { ar: "قبول / رفض الطلبات", en: "Accept / reject requests" },
    },
    {
      key: "activities.view",
      label: { ar: "عرض الأنشطة", en: "Show activities" },
    },
    {
      key: "contacts.view",
      label: { ar: "عرض قائمة التواصل", en: "Show contacts list" },
    },
  ],
}

export const PLATFORM_PERMISSION_GROUPS: PermissionGroup[] = [
  PLATFORM_GENERAL_GROUP,
  ...PLATFORM_ENTITIES.map(buildEntityGroup),
]

export function allPermissionKeys(groups: PermissionGroup[]): string[] {
  return groups.flatMap((g) => g.permissions.map((p) => p.key))
}
