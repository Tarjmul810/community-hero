// app/api/translate/route.ts
import { translateText } from "@/lib/translate"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { texts, targetLang } = await req.json()

    if (!texts || !targetLang) {
      return NextResponse.json(
        { error: "texts and targetLang are required" },
        { status: 400 }
      )
    }

    const translated = await Promise.all(
      texts.map((text: string) => translateText(text, targetLang))
    )

    return NextResponse.json({ translated })
  } catch (e) {
    console.error("Translate error:", e)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}