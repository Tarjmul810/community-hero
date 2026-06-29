import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" })

export async function analyzeIssueImage(imageBase64: string) {
  const prompt = `
    You are analyzing a community infrastructure issue image.
    Return a JSON object with exactly these fields:
    {
      "category": one of [POTHOLE, STREETLIGHT, WATER_SUPPLY, WASTE_MANAGEMENT, ROAD_DAMAGE, DRAINAGE, NOISE_POLLUTION, OTHER],
      "severity": one of [MINOR, MODERATE, CRITICAL],
      "title": short title of the issue (max 10 words),
      "description": clear description of the issue (2-3 sentences),
      "resolution": suggested fix and estimated timeline,
      "impact": estimated community impact (how many people affected and urgency)
    }
    Return only valid JSON, no markdown, no backticks, nothing else.
  `

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
    ])

    const text = result.response.text().trim()
    // strip markdown code fences if Gemini adds them anyway
    const clean = text.replace(/^```json\n?/, "").replace(/```$/, "").trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error("Gemini analyzeIssueImage error:", e)
    throw new Error("Image analysis failed")
  }
}

export async function generateAreaInsights(
  locality: string,
  issues: { category: string; severity: string; createdAt: Date }[]
) {
  const prompt = `
    You are a civic data analyst. Here is a summary of recent community issues 
    reported in ${locality}:
    ${JSON.stringify(issues, null, 2)}

    Return a JSON object with exactly these fields:
    {
      "insight": a 2-3 sentence human-readable pattern analysis,
      "dominantCategory": the most common issue category,
      "riskLevel": one of [LOW, MEDIUM, HIGH],
      "recommendation": one actionable suggestion for local authorities
    }
    Return only valid JSON, no markdown, no backticks.
  `

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const clean = text.replace(/^```json\n?/, "").replace(/```$/, "").trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error("Gemini generateAreaInsights error:", e)
    throw new Error("Insight generation failed")
  }
}

export async function checkDuplicate(
  newTitle: string,
  newDescription: string,
  nearbyIssues: { id: string; title: string; description: string }[]
) {
  if (nearbyIssues.length === 0) return { isDuplicate: false, duplicateOfId: null }

  const prompt = `
    A new community issue has been reported:
    Title: "${newTitle}"
    Description: "${newDescription}"

    Here are existing nearby issues:
    ${JSON.stringify(nearbyIssues, null, 2)}

    Determine if the new issue is a duplicate of any existing one.
    Return a JSON object with exactly these fields:
    {
      "isDuplicate": true or false,
      "duplicateOfId": the id of the duplicate issue or null
    }
    Return only valid JSON, no markdown, no backticks.
  `

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const clean = text.replace(/^```json\n?/, "").replace(/```$/, "").trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error("Gemini checkDuplicate error:", e)
    return { isDuplicate: false, duplicateOfId: null }
  }
}