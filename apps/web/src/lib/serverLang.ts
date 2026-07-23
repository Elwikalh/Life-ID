import { cookies } from "next/headers"
import { defaultLangForRole, type Lang } from "./i18n"

// تحديد لغة الصفحة على الخادم: من الكوكي أوًلا، وإلا الافتراضي حسب الدور
export async function getLang(role?: string): Promise<Lang> {
  const store = await cookies()
  const c = store.get("lang")?.value
  if (c === "ar" || c === "en") return c
  return defaultLangForRole(role)
}
