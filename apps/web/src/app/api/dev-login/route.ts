import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// الإيميلات التجريبية المسموح بيها فقط
const ALLOWED = new Set([
  "doctor@lifeidapp.com",
  "clinic@lifeidapp.com",
  "hospital@lifeidapp.com",
  "pharmacy@lifeidapp.com",
  "lab@lifeidapp.com",
  "radiology@lifeidapp.com",
  "emergency@lifeidapp.com",
  "pharma@lifeidapp.com",
  "rep@lifeidapp.com",
  "patient1@lifeidapp.com",
  "patient2@lifeidapp.com",
  "patient3@lifeidapp.com",
  "admin@lifeidapp.com",
])

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string }
    const email = body.email ?? ""
    if (!ALLOWED.has(email)) {
      return NextResponse.json({ error: "إيميل غير مسموح" }, { status: 400 })
    }
    const client = await clerkClient()
    const list = await client.users.getUserList({ emailAddress: [email] })
    const user = list.data[0]
    if (!user) {
      return NextResponse.json(
        { error: "الحساب مش موجود — شغّل رابط seed الأول" },
        { status: 404 },
      )
    }
    const token = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    })
    return NextResponse.json({ token: token.token })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
