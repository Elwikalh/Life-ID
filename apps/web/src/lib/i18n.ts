export type Lang = "ar" | "en"

export const LANGS: Lang[] = ["ar", "en"]

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr"
}

// مقدمو الخدمة يتعاملون غالبًا بالإنجليزية، فتكون الإنجليزية هي الافتراضية لهم
const ENGLISH_FIRST_ROLES = new Set([
  "doctor",
  "clinic",
  "hospital",
  "pharmacy",
  "lab",
  "radiology",
  "pharma_company",
  "medical_rep",
  "emergency",
  "super_admin",
])

export function defaultLangForRole(role?: string): Lang {
  return role && ENGLISH_FIRST_ROLES.has(role) ? "en" : "ar"
}

export type Bi = { ar: string; en: string }

export function t(v: Bi, lang: Lang): string {
  return lang === "ar" ? v.ar : v.en
}

export const ROLE_LABELS: Record<string, Bi> = {
  patient: { ar: "مريض", en: "Patient" },
  doctor: { ar: "طبيب", en: "Doctor" },
  clinic: { ar: "عيادة", en: "Clinic" },
  pharmacy: { ar: "صيدلية", en: "Pharmacy" },
  lab: { ar: "معمل تحاليل", en: "Laboratory" },
  radiology: { ar: "مركز أشعة", en: "Radiology" },
  hospital: { ar: "مستشفى", en: "Hospital" },
  pharma_company: { ar: "شركة أدوية", en: "Pharma Company" },
  medical_rep: { ar: "مندوب دعاية طبية", en: "Medical Rep" },
  emergency: { ar: "طوارئ", en: "Emergency" },
  super_admin: { ar: "مدير النظام", en: "Super Admin" },
}

export const UI = {
  searchPlaceholder: { ar: "ابحث في Life ID…", en: "Search Life ID…" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  user: { ar: "مستخدم", en: "User" },
}
