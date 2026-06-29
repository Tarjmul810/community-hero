"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@/components/user-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { MapPin, ThumbsUp, CheckCheck, Clock, Loader2 } from "lucide-react"
import { formatDate, getCategoryIcon, getSeverityColor, getStatusColor } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { LanguageSwitcher } from "@/components/language-switcher"
import { showBadgeToasts } from "@/components/badge-toast"

export default function IssueDetailPage() {
  const { id } = useParams()
  const { user } = useUser()
  const [issue, setIssue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<{
    title: string
    description: string
    resolution: string
    impactEstimate: string
  } | null>(null)

  async function fetchIssue() {
    const res = await fetch(`/api/issues/${id}`)
    const data = await res.json()
    setIssue(data)
    setLoading(false)
  }

  useEffect(() => { fetchIssue() }, [id])

  async function handleTranslate(lang: string) {
  if (lang === "en") { setTranslated(null); return }
  setTranslating(true)

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: [
        issue.title,
        issue.description,
        issue.resolution,
        issue.impactEstimate,
      ],
      targetLang: lang,
    }),
  })

  const data = await res.json()
  setTranslated({
    title: data.translated[0],
    description: data.translated[1],
    resolution: data.translated[2],
    impactEstimate: data.translated[3],
  })
  setTranslating(false)
}

  async function handleVote(type: "UPVOTE" | "VERIFY") {
    if (!user) { toast.error("Please set up your profile first"); return }
    setVoting(true)

    const res = await fetch(`/api/issues/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, type }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(type === "VERIFY" ? "Issue verified!" : "Upvoted!")
      showBadgeToasts(data.newBadges)
      fetchIssue()
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Vote failed")
    }
    setVoting(false)
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )

  if (!issue) return (
    <div className="text-center py-24 text-muted-foreground">Issue not found</div>
  )

  const hasVoted = issue.votes?.some((v: any) => v.userId === user?.id)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div>
  <div className="flex items-start justify-between gap-3 mb-3">
    <h1 className="text-2xl font-bold leading-tight">
      {translated?.title ?? issue.title}
    </h1>
    <span className="text-3xl">{getCategoryIcon(issue.category)}</span>
  </div>
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap gap-2">
      <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
      <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
      <Badge variant="outline">{issue.category?.replace("_", " ")}</Badge>
    </div>
  </div>
</div>

      {/* Image */}
      <img
        src={issue.imageUrl}
        alt={issue.title}
        className="w-full h-72 object-cover rounded-xl"
      />

      {/* Vote actions */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{issue._count?.votes ?? 0}</span> community members confirmed this
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("UPVOTE")}
              disabled={hasVoted || voting}
              className="gap-1.5"
            >
              <ThumbsUp size={14} />
              Upvote
            </Button>
            <Button
              size="sm"
              onClick={() => handleVote("VERIFY")}
              disabled={hasVoted || voting}
              className="gap-1.5"
            >
              {voting ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              I witnessed this
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Issue Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{issue.description}</p>
          </div>
          <Separator />
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">{issue.address}</p>
              <p className="text-xs text-muted-foreground">{issue.locality}, {issue.city}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reported by</p>
              <p className="font-medium">{issue.user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reported on</p>
              <p className="font-medium">{formatDate(issue.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-primary/5">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">🤖 AI Analysis</CardTitle>
      <LanguageSwitcher onTranslate={handleTranslate} loading={translating} />
    </div>
  </CardHeader>
  <CardContent className="space-y-4 text-sm">
    <div>
      <p className="text-xs text-muted-foreground mb-1">Description</p>
      <p>{translated?.description ?? issue.description}</p>
    </div>
    <Separator />
    <div>
      <p className="text-xs text-muted-foreground mb-1">Suggested Resolution</p>
      <p>{translated?.resolution ?? issue.resolution}</p>
    </div>
    <Separator />
    <div>
      <p className="text-xs text-muted-foreground mb-1">Community Impact</p>
      <p>{translated?.impactEstimate ?? issue.impactEstimate}</p>
    </div>
  </CardContent>
</Card>

      {/* Status Timeline */}
      {issue.statusLogs?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Status Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issue.statusLogs.map((log: any, i: number) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    {i < issue.statusLogs.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="font-medium">{log.toStatus}</p>
                    {log.note && <p className="text-xs text-muted-foreground mt-0.5">{log.note}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}