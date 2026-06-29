"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getLocalUser, setLocalUser, type LocalUser } from "@/lib/user"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UserContextType {
  user: LocalUser | null
  setUser: (user: LocalUser) => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
})

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<LocalUser | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const existing = getLocalUser()
    if (existing) {
      setUserState(existing)
    } else {
      setShowOnboarding(true)
    }
  }, [])

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return
    setLoading(true)

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    })

    const newUser = await res.json()
    setLocalUser(newUser)
    setUserState(newUser)
    setShowOnboarding(false)
    setLoading(false)
  }

  return (
    <UserContext.Provider value={{ user, setUser: (u) => { setLocalUser(u); setUserState(u) } }}>
      {children}
      <Dialog open={showOnboarding}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Welcome to Community Hero 🦸
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Join your community in reporting and resolving local issues.
          </p>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading || !name || !email}
            >
              {loading ? "Setting up..." : "Get Started"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UserContext.Provider>
  )
}