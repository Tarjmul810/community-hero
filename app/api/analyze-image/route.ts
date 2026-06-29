// app/api/analyze-image/route.ts
import { analyzeIssueImage } from "@/lib/gemini"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const result = await analyzeIssueImage(imageBase64)
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}