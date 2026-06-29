import { randomUUID } from "crypto"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function getPresignedUploadUrl(
  userId: string,
  fileName: string,
  fileType: string
): Promise<{ url: string; key: string }> {
  const Key = `community-hero/${userId}/${randomUUID()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key,
    ContentType: fileType,
  })

  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { url, key: Key }
}

export async function getPresignedReadUrl(r2Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
  })

  return getSignedUrl(client, command, { expiresIn: 3600 })
}