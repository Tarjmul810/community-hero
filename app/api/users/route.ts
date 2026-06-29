import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email },
  })

  return NextResponse.json(user)
}