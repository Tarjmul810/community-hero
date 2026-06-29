import { prisma } from "@/lib/prisma"
import { analyzeIssueImage, checkDuplicate } from "@/lib/gemini"
import { checkAndAwardBadges } from "@/lib/badges"
import { IssueStatus } from "../../../generated/prisma/enums"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const locality = searchParams.get("locality")

  const issues = await prisma.issue.findMany({
    where: {
      deletedAt: null,
      ...(status && { status: status as any }),
      ...(category && { category: category as any }),
      ...(locality && { locality }),
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      votes: true,
      _count: { select: { votes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(issues)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      imageBase64,
      imageUrl,
      latitude,
      longitude,
      address,
      locality,
      city,
      pincode,
      userId,
    } = body

    // 1. Analyze image with Gemini
    const analysis = await analyzeIssueImage(imageBase64)

    // 2. Check for duplicates within ~500m radius
    const nearbyIssues = await prisma.issue.findMany({
      where: {
        deletedAt: null,
        isDuplicate: false,
        latitude: { gte: latitude - 0.005, lte: latitude + 0.005 },
        longitude: { gte: longitude - 0.005, lte: longitude + 0.005 },
      },
      select: { id: true, title: true, description: true },
    })

    const duplicateCheck = await checkDuplicate(
      analysis.title,
      analysis.description,
      nearbyIssues
    )

    // 3. Create issue
    const issue = await prisma.issue.create({
      data: {
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        severity: analysis.severity,
        imageUrl,
        latitude,
        longitude,
        address,
        locality,
        city,
        pincode,
        aiDescription: analysis.description,
        resolution: analysis.resolution,
        impactEstimate: analysis.impact,
        isDuplicate: duplicateCheck.isDuplicate,
        duplicateOfId: duplicateCheck.duplicateOfId,
        userId,
        status: duplicateCheck.isDuplicate ? IssueStatus.DUPLICATE : IssueStatus.REPORTED,
      },
    })

    // 4. Log status
    await prisma.issueStatusLog.create({
      data: {
        issueId: issue.id,
        toStatus: issue.status,
        changedBy: "ai",
        note: duplicateCheck.isDuplicate
          ? "Auto-marked as duplicate by AI"
          : "Issue reported and analyzed by AI",
      },
    })

    // 5. Award points + badges
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 10 } },
    })
   const newBadges = await checkAndAwardBadges(userId)

    return NextResponse.json({ issue, newBadges}, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 })
  }
}