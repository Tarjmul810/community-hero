import { prisma } from "@/lib/prisma"
import { IssueStatus } from "../../../../../generated/prisma/enums"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status, note, changedBy } = await req.json()

  const issue = await prisma.issue.findUnique({ where: { id } })
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.issue.update({
    where: { id },
    data: {
      status: status as IssueStatus,
      ...(status === IssueStatus.RESOLVED && { resolvedAt: new Date() }),
    },
  })

  await prisma.issueStatusLog.create({
    data: {
      issueId: id,
      fromStatus: issue.status,
      toStatus: status as IssueStatus,
      changedBy: changedBy ?? "admin",
      note: note ?? `Status updated to ${status}`,
    },
  })

  return NextResponse.json(updated)
}