export async function uploadImageToR2(
  file: File,
  userId: string
): Promise<{ key: string; publicUrl: string; base64: string }> {

  // 1. get presigned URL from our API
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      fileName: file.name,
      fileType: file.type,
    }),
  })

  if (!res.ok) throw new Error("Failed to get upload URL")

  const { presignedUrl, key, publicUrl } = await res.json()

  // 2. upload directly to R2 using presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })

  if (!uploadRes.ok) throw new Error("Failed to upload to R2")

  // 3. also convert to base64 for Gemini analysis
  const base64 = await fileToBase64(file)

  return { key, publicUrl, base64 }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // strip the data:image/jpeg;base64, prefix
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
  })
}