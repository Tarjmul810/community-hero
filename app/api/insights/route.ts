import { prisma } from "../../../lib/prisma"
import { generateAreaInsights } from "@/lib/gemini"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const locality = searchParams.get("locality") ?? "your area"

  const issues = await prisma.issue.findMany({
    where: {
      locality,
      deletedAt: null,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { category: true, severity: true, createdAt: true },
  })

  if (issues.length < 3) {
    return NextResponse.json({
      insight: "Not enough data yet for this area.",
      dominantCategory: null,
      riskLevel: "LOW",
      recommendation: "Encourage more residents to report issues.",
    })
  }

  const insight = await generateAreaInsights(locality, issues)
  return NextResponse.json(insight)
}