"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "./user-provider"
import { cn } from "@/lib/utils"
import { MapPin, LayoutDashboard, Trophy, Plus, Shield } from "lucide-react"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"

const links = [
  { href: "/", label: "Feed", icon: MapPin },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
]

export function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          🦸 <span>Community Hero</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/report">
            <Button size="sm" className="gap-1.5">
              <Plus size={15} />
              Report Issue
            </Button>
          </Link>
          <Link href="/admin">
  <Button size="sm" variant="outline" className="gap-1.5">
    <Shield size={15} />
    Admin
  </Button>
</Link>
          {user && (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </nav>
  )
}