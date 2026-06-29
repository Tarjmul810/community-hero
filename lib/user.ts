export interface LocalUser {
  id: string
  name: string
  email: string
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("community-hero-user")
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setLocalUser(user: LocalUser) {
  localStorage.setItem("community-hero-user", JSON.stringify(user))
}

export function clearLocalUser() {
  localStorage.removeItem("community-hero-user")
}