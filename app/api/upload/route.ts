import { getPresignedUploadUrl } from "@/lib/r2"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId, fileName, fileType } = await req.json()

    if (!userId || !fileName || !fileType) {
      return NextResponse.json(
        { error: "userId, fileName and fileType are required" },
        { status: 400 }
      )
    }

    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    const { url, key } = await getPresignedUploadUrl(userId, fileName, fileType)

    // public URL for storing in DB after upload
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ presignedUrl: url, key, publicUrl })
  } catch (e) {
    console.error("Upload error:", e)
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
  }
}