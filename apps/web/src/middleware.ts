import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// المسارات المحمية (لازم تسجيل دخول)
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/pending(.*)",
  "/admin(.*)"
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // كل المسارات ماعدا الملفات الاستاتيك والـ _next
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf)).*)",
    "/(api|trpc)(.*)"
  ]
}
