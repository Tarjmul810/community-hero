import { prisma } from "../../../../../lib/prisma"
import { checkAndAwardBadges } from "@/lib/badges"
import { IssueStatus, VoteType } from "../../../../../generated/prisma/enums"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, type } = await req.json()
    const { id } = await params

    const existing = await prisma.vote.findUnique({
      where: { userId_issueId: { userId, issueId: id } },
    })

    if (existing) {
      return NextResponse.json({ error: "Already voted" }, { status: 400 })
    }

    await prisma.vote.create({
      data: {
        userId,
        issueId: id,
        type: type ?? VoteType.UPVOTE,
      },
    })

    // if 5+ votes, auto-verify
    const voteCount = await prisma.vote.count({ where: { issueId: id} })

    if (voteCount >= 5) {
      const issue = await prisma.issue.findUnique({ where: { id } })
      if (issue?.status === IssueStatus.REPORTED) {
        await prisma.issue.update({
          where: { id },
          data: { status: IssueStatus.VERIFIED },
        })
        await prisma.issueStatusLog.create({
          data: {
            issueId: id,
            fromStatus: IssueStatus.REPORTED,
            toStatus: IssueStatus.VERIFIED,
            changedBy: "system",
            note: "Auto-verified after 5 community votes",
          },
        })
      }
    }

    // reward voter
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 2 } },
    })
    const newBadges = await checkAndAwardBadges(userId)

    return NextResponse.json({ success: true, voteCount, newBadges })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Vote failed" }, { status: 500 })
  }
}