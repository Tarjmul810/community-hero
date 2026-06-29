import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const issue = await prisma.issue.findUnique({
    where: { id: id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      votes: { include: { user: { select: { id: true, name: true } } } },
      comments: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      statusLogs: { orderBy: { createdAt: "asc" } },
      duplicateOf: { select: { id: true, title: true } },
      _count: { select: { votes: true, comments: true } },
    },
  })

  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(issue)
}