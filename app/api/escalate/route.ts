// app/api/escalate/route.ts — update the POST handler
import { prisma } from "@/lib/prisma"
import { IssueStatus, Severity } from "../../../generated/prisma/enums"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  // Vercel cron sends this header
  const authHeader = req.headers.get("authorization")
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  const toEscalate = await prisma.issue.findMany({
    where: {
      status: { in: [IssueStatus.REPORTED, IssueStatus.VERIFIED] },
      severity: Severity.CRITICAL,
      createdAt: { lte: threeDaysAgo },
      escalatedAt: null,
      deletedAt: null,
    },
  })

  for (const issue of toEscalate) {
    await prisma.issue.update({
      where: { id: issue.id },
      data: {
        status: IssueStatus.ESCALATED,
        escalatedAt: new Date(),
      },
    })

    await prisma.issueStatusLog.create({
      data: {
        issueId: issue.id,
        fromStatus: issue.status,
        toStatus: IssueStatus.ESCALATED,
        changedBy: "system",
        note: "Auto-escalated: critical issue unresolved for 3+ days",
      },
    })
  }

  return NextResponse.json({
    escalated: toEscalate.length,
    issueIds: toEscalate.map((i) => i.id),
  })
}