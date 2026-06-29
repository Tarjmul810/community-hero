"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getSeverityColor, getStatusColor, getCategoryIcon, formatDate } from "@/lib/utils"
import { Shield, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react"

const STATUSES = ["REPORTED", "VERIFIED", "IN_PROGRESS", "RESOLVED", "ESCALATED"]

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("ALL")
  const [updating, setUpdating] = useState<string | null>(null)

  async function handleLogin() {
    setAuthLoading(true)
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setAuthed(true)
      fetchIssues()
    } else {
      toast.error("Invalid password")
    }
    setAuthLoading(false)
  }

  async function fetchIssues() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== "ALL") params.set("status", filter)
    const res = await fetch(`/api/issues?${params.toString()}`)
    const data = await res.json()
    setIssues(data)
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchIssues()
  }, [filter, authed])

  async function updateStatus(issueId: string, status: string) {
    setUpdating(issueId)

    const res = await fetch(`/api/issues/${issueId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: `Status changed to ${status} by admin`,
        changedBy: "admin",
      }),
    })

    if (res.ok) {
      toast.success(`Issue marked as ${status}`)
      fetchIssues()
    } else {
      toast.error("Failed to update status")
    }
    setUpdating(null)
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const total = issues.length
  const escalated = issues.filter((i) => i.status === "ESCALATED").length
  const resolved = issues.filter((i) => i.status === "RESOLVED").length
  const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
              <Shield className="text-primary" size={22} />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">
              Community Hero Authority Panel
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={authLoading || !password}
            >
              {authLoading ? "Verifying..." : "Access Panel"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-primary" size={22} />
          <div>
            <h1 className="text-2xl font-bold">Authority Panel</h1>
            <p className="text-sm text-muted-foreground">
              Manage and resolve community issues
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchIssues}
          className="gap-1.5"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Issues", value: total, icon: Clock, color: "bg-blue-500/10 text-blue-500" },
          { label: "Escalated", value: escalated, icon: AlertTriangle, color: "bg-red-500/10 text-red-500" },
          { label: "In Progress", value: inProgress, icon: Clock, color: "bg-yellow-500/10 text-yellow-500" },
          { label: "Resolved", value: resolved, icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Filter by status:</p>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Issues</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Issues list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-medium">No issues found</p>
            </div>
          ) : (
            issues.map((issue, index) => (
              <div key={issue.id}>
                <div className="p-4 flex gap-4">
                  {/* Image */}
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-20 h-20 object-cover rounded-lg shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">
                        {getCategoryIcon(issue.category)} {issue.title}
                      </h3>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {issue.address}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>By {issue.user?.name}</span>
                      <span>·</span>
                      <span>{formatDate(issue.createdAt)}</span>
                      <span>·</span>
                      <span>{issue._count?.votes ?? 0} votes</span>
                    </div>

                    {/* Status + actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Badge className={`text-xs ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </Badge>

                      {/* Quick action buttons */}
                      {issue.status !== "RESOLVED" && (
                        <>
                          {issue.status !== "IN_PROGRESS" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs px-2 gap-1"
                              disabled={updating === issue.id}
                              onClick={() => updateStatus(issue.id, "IN_PROGRESS")}
                            >
                              <Clock size={10} />
                              In Progress
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="h-6 text-xs px-2 gap-1 bg-green-600 hover:bg-green-700"
                            disabled={updating === issue.id}
                            onClick={() => updateStatus(issue.id, "RESOLVED")}
                          >
                            <CheckCircle2 size={10} />
                            {updating === issue.id ? "Updating..." : "Mark Resolved"}
                          </Button>
                        </>
                      )}

                      {issue.status === "RESOLVED" && (
                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Resolved {issue.resolvedAt ? formatDate(issue.resolvedAt) : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {index < issues.length - 1 && <Separator />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}