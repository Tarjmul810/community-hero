// app/api/seed/route.ts
import { seedBadges } from "@/lib/badges"
import { NextResponse } from "next/server"

export async function GET() {
  await seedBadges()
  return NextResponse.json({ success: true })
}