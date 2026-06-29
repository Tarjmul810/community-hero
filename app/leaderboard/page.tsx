// app/leaderboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Trophy, Star, FileText } from "lucide-react"
import { useUser } from "@/components/user-provider"

const BADGE_EMOJI: Record<string, string> = {
  FIRST_REPORT: "🌱",
  COMMUNITY_HERO: "🦸",
  VERIFIED_REPORTER: "✅",
  TOP_CONTRIBUTOR: "⭐",
  AREA_GUARDIAN: "🛡️",
}

const BADGE_LABEL: Record<string, string> = {
  FIRST_REPORT: "First Report",
  COMMUNITY_HERO: "Community Hero",
  VERIFIED_REPORTER: "Verified Reporter",
  TOP_CONTRIBUTOR: "Top Contributor",
  AREA_GUARDIAN: "Area Guardian",
}

const RANK_STYLES: Record<number, string> = {
  0: "border-yellow-400/50 bg-yellow-400/5",
  1: "border-slate-300/50 bg-slate-300/5",
  2: "border-amber-600/50 bg-amber-600/5",
}

const RANK_LABEL: Record<number, string> = {
  0: "🥇",
  1: "🥈",
  2: "🥉",
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user: currentUser } = useUser()

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false) })
  }, [])

  const topThree = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400/10 mb-3">
          <Trophy className="text-yellow-500" size={28} />
        </div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top citizens making their community better
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-4xl mb-3">🏙️</p>
          <p className="font-medium">No contributors yet</p>
          <p className="text-sm mt-1">Be the first to report an issue</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 podium cards */}
          {topThree.length > 0 && (
            <div className="space-y-3">
              {topThree.map((user, index) => (
                <Card
                  key={user.id}
                  className={`transition-all ${RANK_STYLES[index] ?? ""} ${
                    user.id === currentUser?.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="text-3xl w-10 text-center shrink-0">
                        {RANK_LABEL[index]}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="text-sm font-bold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate">{user.name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText size={11} />
                            {user._count?.issues ?? 0} issues
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={11} />
                            {user.points} pts
                          </span>
                        </div>

                        {/* Badges */}
                        {user.badges?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {user.badges.map((ub: any) => (
                              <span
                                key={ub.badge.id}
                                title={BADGE_LABEL[ub.badge.type]}
                                className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                              >
                                {BADGE_EMOJI[ub.badge.type] ?? "🏅"}
                                <span className="text-muted-foreground">
                                  {BADGE_LABEL[ub.badge.type]}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-primary">
                          {user.points}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Other Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {rest.map((user, index) => (
                  <div key={user.id}>
                    <div
                      className={`flex items-center gap-3 px-5 py-3.5 ${
                        user.id === currentUser?.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                        #{index + 4}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {user.badges?.slice(0, 3).map((ub: any) => (
                            <span key={ub.badge.id} title={BADGE_LABEL[ub.badge.type]}>
                              {BADGE_EMOJI[ub.badge.type] ?? "🏅"}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">{user.points}</p>
                        <p className="text-xs text-muted-foreground">
                          {user._count?.issues ?? 0} issues
                        </p>
                      </div>
                    </div>
                    {index < rest.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Points guide */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">How to earn points</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              {[
                { action: "Report an issue", points: "+10 pts" },
                { action: "Vote on an issue", points: "+2 pts" },
                { action: "First Report badge", points: "+10 pts" },
                { action: "Verified Reporter badge", points: "+30 pts" },
                { action: "Area Guardian badge", points: "+40 pts" },
                { action: "Community Hero badge", points: "+50 pts" },
              ].map(({ action, points }) => (
                <div key={action} className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground text-xs">{action}</span>
                  <span className="text-xs font-semibold text-primary shrink-0">{points}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}