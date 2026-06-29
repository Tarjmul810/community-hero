import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { points: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      points: true,
      badges: {
        include: { badge: true },
      },
      _count: { select: { issues: true } },
    },
  })

  return NextResponse.json(users)
}