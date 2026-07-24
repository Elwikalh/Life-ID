import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@life-id/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ count: 0 })
  let count = 0
  try {
    count = await prisma.notification.count({
      where: { userId: user.id, read: false },
    })
  } catch {}
  return NextResponse.json({ count })
}
