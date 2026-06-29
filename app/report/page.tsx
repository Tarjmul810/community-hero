"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/user-provider"
import { uploadImageToR2 } from "@/lib/upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, MapPin, Loader2, CheckCircle2, X } from "lucide-react"
import { getCategoryIcon, getSeverityColor } from "@/lib/utils"
import { showBadgeToasts } from "@/components/badge-toast"

type Step = "upload" | "analyzing" | "preview" | "locating" | "submitting" | "done"

export default function ReportPage() {
  const router = useRouter()
  const { user } = useUser()

  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    address: string
    locality: string
    city: string
    pincode: string
  } | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return

    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStep("analyzing")

    try {
      // convert to base64 for gemini
      const reader = new FileReader()
      reader.readAsDataURL(f)
      reader.onload = async () => {
        const b64 = (reader.result as string).split(",")[1]
        setBase64(b64)

        // analyze with gemini
        const res = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: b64 }),
        })
        const data = await res.json()
        setAnalysis(data)
        setStep("preview")
      }
    } catch {
      toast.error("Failed to analyze image")
      setStep("upload")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  async function detectLocation() {
    setStep("locating")

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        // reverse geocode using google
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const data = await res.json()
        const components = data.results[0]?.address_components ?? []

        const get = (type: string) =>
          components.find((c: any) => c.types.includes(type))?.long_name ?? ""

        setLocation({
          lat: latitude,
          lng: longitude,
          address: data.results[0]?.formatted_address ?? "Unknown location",
          locality: get("sublocality_level_1") || get("locality"),
          city: get("administrative_area_level_2"),
          pincode: get("postal_code"),
        })

        setStep("preview")
      },
      () => {
        toast.error("Could not get location. Please enable location access.")
        setStep("preview")
      }
    )
  }

  async function handleSubmit() {
    if (!user) { toast.error("Please set up your profile first"); return }
    if (!file || !analysis || !location) {
      toast.error("Please complete all steps first")
      return
    }

    setStep("submitting")

    try {
      // upload image to R2
      const { publicUrl } = await uploadImageToR2(file, user.id)

      // submit issue
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageUrl: publicUrl,
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
          locality: location.locality,
          city: location.city,
          pincode: location.pincode,
          userId: user.id,
        }),
      })

      if (!res.ok) throw new Error("Submission failed")

      const { newBadges } = await res.json()
      showBadgeToasts(newBadges)

      setStep("done")
      toast.success("Issue reported successfully!")
      setTimeout(() => router.push("/"), 1500)
    } catch {
      toast.error("Failed to submit issue")
      setStep("preview")
    }
  }

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold">Issue Reported!</h2>
        <p className="text-muted-foreground mt-2">Redirecting to feed...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Report an Issue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a photo — our AI will analyze and categorize it automatically
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress
          value={
            step === "upload" ? 0 :
              step === "analyzing" ? 33 :
                step === "preview" ? 66 :
                  step === "locating" ? 75 :
                    step === "submitting" ? 90 : 100
          }
          className="h-1.5"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Upload</span>
          <span>AI Analysis</span>
          <span>Location</span>
          <span>Submit</span>
        </div>
      </div>

      {/* Upload zone */}
      {step === "upload" && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 text-muted-foreground" size={40} />
          <p className="font-medium">Drop your photo here</p>
          <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
          <p className="text-xs text-muted-foreground mt-3">JPG, PNG up to 10MB</p>
        </div>
      )}

      {/* Analyzing */}
      {step === "analyzing" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={40} />
            <p className="font-medium">Analyzing your image...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gemini AI is identifying the issue
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview + location */}
      {(step === "preview" || step === "locating" || step === "submitting") && analysis && (
        <div className="space-y-4">
          {/* Image preview */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <img
                  src={preview!}
                  alt="Issue"
                  className="w-full h-56 object-cover rounded-lg"
                />
                <button
                  onClick={() => { setStep("upload"); setFile(null); setPreview(null); setAnalysis(null) }}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis result */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">AI detected</p>
                  <h3 className="font-semibold">{analysis.title}</h3>
                </div>
                <span className="text-2xl">{getCategoryIcon(analysis.category)}</span>
              </div>

              <div className="flex gap-2">
                <Badge variant="outline" className={getSeverityColor(analysis.severity)}>
                  {analysis.severity}
                </Badge>
                <Badge variant="outline">{analysis.category?.replace("_", " ")}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">{analysis.description}</p>

              <div className="border-t pt-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Suggested Resolution</p>
                  <p className="text-sm mt-0.5">{analysis.resolution}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Community Impact</p>
                  <p className="text-sm mt-0.5">{analysis.impact}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {location ? (
            <div className="space-y-3">
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=600x200&maptype=roadmap&markers=color:red%7C${location.lat},${location.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                alt="Issue location"
                className="w-full h-36 object-cover rounded-lg"
              />
              <div className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-sm font-medium">{location.address}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {location.locality}, {location.city} {location.pincode}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={detectLocation}
              disabled={step === "locating"}
            >
              {step === "locating" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <MapPin size={15} />
              )}
              {step === "locating" ? "Detecting location..." : "Detect My Location"}
            </Button>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!location || step === "submitting"}
          >
            {step === "submitting" ? (
              <><Loader2 size={15} className="animate-spin mr-2" /> Submitting...</>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}