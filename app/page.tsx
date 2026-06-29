"use client"

import { useEffect, useState } from "react"
import { IssueCard } from "@/components/issue-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SlidersHorizontal } from "lucide-react"

const CATEGORIES = ["ALL", "POTHOLE", "STREETLIGHT", "WATER_SUPPLY", "WASTE_MANAGEMENT", "ROAD_DAMAGE", "DRAINAGE", "NOISE_POLLUTION", "OTHER"]
const STATUSES = ["ALL", "REPORTED", "VERIFIED", "IN_PROGRESS", "RESOLVED", "ESCALATED"]

export default function FeedPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("ALL")
  const [status, setStatus] = useState("ALL")

  async function fetchIssues() {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== "ALL") params.set("category", category)
    if (status !== "ALL") params.set("status", status)

    const res = await fetch(`/api/issues?${params.toString()}`)
    const data = await res.json()
    setIssues(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchIssues()
  }, [category, status])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Community Issues</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {issues.length} issues reported in your area
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-muted-foreground" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-4xl mb-3">🏙️</p>
          <p className="font-medium">No issues found</p>
          <p className="text-sm mt-1">Be the first to report one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}