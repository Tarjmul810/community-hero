import { prisma } from "./prisma"
import { BadgeType } from "../generated/prisma/enums"

const BADGE_DEFINITIONS = [
  {
    type: BadgeType.FIRST_REPORT,
    name: "First Report",
    description: "Reported your first community issue",
    pointsValue: 10,
  },
  {
    type: BadgeType.COMMUNITY_HERO,
    name: "Community Hero",
    description: "Reported 10 or more issues",
    pointsValue: 50,
  },
  {
    type: BadgeType.VERIFIED_REPORTER,
    name: "Verified Reporter",
    description: "Had 3 issues verified by the community",
    pointsValue: 30,
  },
  {
    type: BadgeType.TOP_CONTRIBUTOR,
    name: "Top Contributor",
    description: "Reached 100 points",
    pointsValue: 0,
  },
  {
    type: BadgeType.AREA_GUARDIAN,
    name: "Area Guardian",
    description: "Reported issues in 5 different localities",
    pointsValue: 40,
  },
]

export async function seedBadges() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { type: badge.type },
      update: {},
      create: badge,
    })
  }
}

export async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      issues: true,
      badges: { include: { badge: true } },
    },
  })

  if (!user) return

  const earnedBadgeTypes = user.badges.map((b) => b.badge.type)
  const badgesToAward: BadgeType[] = []

  // First report
  if (user.issues.length >= 1 && !earnedBadgeTypes.includes(BadgeType.FIRST_REPORT)) {
    badgesToAward.push(BadgeType.FIRST_REPORT)
  }

  // Community hero — 10 issues
  if (user.issues.length >= 10 && !earnedBadgeTypes.includes(BadgeType.COMMUNITY_HERO)) {
    badgesToAward.push(BadgeType.COMMUNITY_HERO)
  }

  // Top contributor — 100 points
  if (user.points >= 100 && !earnedBadgeTypes.includes(BadgeType.TOP_CONTRIBUTOR)) {
    badgesToAward.push(BadgeType.TOP_CONTRIBUTOR)
  }

  // Verified reporter — 3 verified issues
  const verifiedCount = user.issues.filter((i) => i.status === "VERIFIED").length
  if (verifiedCount >= 3 && !earnedBadgeTypes.includes(BadgeType.VERIFIED_REPORTER)) {
    badgesToAward.push(BadgeType.VERIFIED_REPORTER)
  }

  // Area guardian — 5 different localities
  const localities = new Set(user.issues.map((i) => i.locality).filter(Boolean))
  if (localities.size >= 5 && !earnedBadgeTypes.includes(BadgeType.AREA_GUARDIAN)) {
    badgesToAward.push(BadgeType.AREA_GUARDIAN)
  }

  const awardedBadges: any = []

  for (const badgeType of badgesToAward) {
    const badge = await prisma.badge.findUnique({ where: { type: badgeType } })
    if (!badge) continue

    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: badge.pointsValue } },
    })
  }
  return awardedBadges
}