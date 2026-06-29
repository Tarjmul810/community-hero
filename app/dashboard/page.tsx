"use client"

import { useEffect, useState } from "react"
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getSeverityColor, getStatusColor, getCategoryIcon } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Zap,
} from "lucide-react"

declare global {
  interface Window {
    google?: any
  }
}

// ─── Heatmap layer (must be inside APIProvider) ───────────────────────────────
function HeatmapLayer({ issues }: { issues: any[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !issues.length || !window.google) return

    const google = window.google
    const markers: any[] = []

    issues.forEach((issue) => {
      const color =
        issue.severity === "CRITICAL"
          ? "#ef4444"
          : issue.severity === "MODERATE"
          ? "#f97316"
          : "#22c55e"

      const circle = new google.maps.Circle({
        map,
        center: { lat: issue.latitude, lng: issue.longitude },
        radius: 80,
        fillColor: color,
        fillOpacity: 0.35,
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 1,
      })

      markers.push(circle)
    })

    return () => markers.forEach((m) => m.setMap(null))
  }, [map, issues])

  return null
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: any
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [insightLoading, setInsightLoading] = useState(true)
  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.209 }) // default Delhi

  useEffect(() => {
    // get user location for map center
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })

    // fetch all issues
    fetch("/api/issues")
      .then((r) => r.json())
      .then((data) => {
        setIssues(data)
        setLoading(false)

        // fetch insights for most common locality
        const localityCounts: Record<string, number> = {}
        data.forEach((i: any) => {
          if (i.locality) {
            localityCounts[i.locality] = (localityCounts[i.locality] ?? 0) + 1
          }
        })
        const topLocality = Object.entries(localityCounts).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0]

        if (topLocality) {
          fetch(`/api/insights?locality=${encodeURIComponent(topLocality)}`)
            .then((r) => r.json())
            .then((d) => { setInsights(d); setInsightLoading(false) })
        } else {
          setInsightLoading(false)
        }
      })
  }, [])

  // ── derived stats ────────────────────────────────────────────────────────
  const total = issues.length
  const resolved = issues.filter((i) => i.status === "RESOLVED").length
  const escalated = issues.filter((i) => i.status === "ESCALATED").length
  const verified = issues.filter((i) => i.status === "VERIFIED").length
  const critical = issues.filter((i) => i.severity === "CRITICAL").length

  // category breakdown
  const categoryCounts: Record<string, number> = {}
  issues.forEach((i) => {
    categoryCounts[i.category] = (categoryCounts[i.category] ?? 0) + 1
  })
  const sortedCategories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  )

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impact Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of community issues
        </p>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Issues"
            value={total}
            icon={MapPin}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            label="Resolved"
            value={resolved}
            icon={CheckCircle2}
            color="bg-green-500/10 text-green-500"
          />
          <StatCard
            label="Escalated"
            value={escalated}
            icon={AlertTriangle}
            color="bg-red-500/10 text-red-500"
          />
          <StatCard
            label="Verified"
            value={verified}
            icon={Clock}
            color="bg-purple-500/10 text-purple-500"
          />
        </div>
      )}

      {/* ── Map + sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={16} />
                Issue Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[420px]">
                <APIProvider
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                >
                  <Map
                    defaultCenter={center}
                    defaultZoom={13}
                    mapId="community-hero-map"
                    style={{ width: "100%", height: "100%" }}
                    disableDefaultUI={false}
                  >
                    <HeatmapLayer issues={issues} />
                  </Map>
                </APIProvider>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Resolution rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={16} />
                Resolution Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {resolutionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {resolved} of {total} issues resolved
              </p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-lg" />
                ))
              ) : sortedCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                sortedCategories.map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(cat)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">
                          {cat.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{
                            width: `${Math.round((count / total) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Critical issues */}
          {critical > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-semibold text-red-500">
                    {critical} Critical Issue{critical > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Require immediate attention
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── AI Area Insights ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            AI Area Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insightLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : insights ? (
            <div className="space-y-3">
              <p className="text-sm">{insights.insight}</p>
              <div className="flex flex-wrap gap-2">
                {insights.dominantCategory && (
                  <Badge variant="outline" className="gap-1.5">
                    {getCategoryIcon(insights.dominantCategory)}
                    {insights.dominantCategory?.replace("_", " ")}
                  </Badge>
                )}
                {insights.riskLevel && (
                  <Badge
                    variant="outline"
                    className={
                      insights.riskLevel === "HIGH"
                        ? "text-red-500 border-red-500/30"
                        : insights.riskLevel === "MEDIUM"
                        ? "text-yellow-500 border-yellow-500/30"
                        : "text-green-500 border-green-500/30"
                    }
                  >
                    {insights.riskLevel} Risk
                  </Badge>
                )}
              </div>
              {insights.recommendation && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Recommendation for authorities
                  </p>
                  <p className="text-sm font-medium">{insights.recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Report more issues to generate area insights.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Recent issues list ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : issues.slice(0, 8).length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues yet</p>
          ) : (
            <div className="space-y-2">
              {issues.slice(0, 8).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="text-xl">{getCategoryIcon(issue.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{issue.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {issue.address}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge
                      className={`text-xs ${getSeverityColor(issue.severity)}`}
                    >
                      {issue.severity}
                    </Badge>
                    <Badge
                      className={`text-xs ${getStatusColor(issue.status)}`}
                    >
                      {issue.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}