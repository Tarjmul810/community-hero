import { toast } from "sonner"

const BADGE_EMOJI: Record<string, string> = {
  FIRST_REPORT: "🌱",
  COMMUNITY_HERO: "🦸",
  VERIFIED_REPORTER: "✅",
  TOP_CONTRIBUTOR: "⭐",
  AREA_GUARDIAN: "🛡️",
}

interface Badge {
  type: string
  name: string
  description: string
  pointsValue: number
}

export function showBadgeToasts(badges: Badge[]) {
  if (!badges?.length) return

  badges.forEach((badge, i) => {
    setTimeout(() => {
      toast(
        <div className="flex items-start gap-3">
          <div className="text-4xl">{BADGE_EMOJI[badge.type] ?? "🏅"}</div>
          <div>
            <p className="font-bold text-sm">Badge Unlocked!</p>
            <p className="font-semibold text-base">{badge.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {badge.description}
            </p>
            {badge.pointsValue > 0 && (
              <p className="text-xs font-semibold text-primary mt-1">
                +{badge.pointsValue} points earned
              </p>
            )}
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            border: "1px solid hsl(var(--primary) / 0.3)",
            background: "hsl(var(--primary) / 0.05)",
          },
        }
      )
    }, i * 800) // stagger if multiple badges earned at once
  })
}