import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSeverityColor(severity: string) {
  switch (severity) {
    case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/20"
    case "MODERATE": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    case "MINOR": return "text-green-500 bg-green-500/10 border-green-500/20"
    default: return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "REPORTED": return "text-blue-500 bg-blue-500/10"
    case "VERIFIED": return "text-purple-500 bg-purple-500/10"
    case "IN_PROGRESS": return "text-yellow-500 bg-yellow-500/10"
    case "RESOLVED": return "text-green-500 bg-green-500/10"
    case "ESCALATED": return "text-red-500 bg-red-500/10"
    case "DUPLICATE": return "text-gray-500 bg-gray-500/10"
    default: return "text-gray-500 bg-gray-500/10"
  }
}

export function getCategoryIcon(category: string) {
  switch (category) {
    case "POTHOLE": return "🕳️"
    case "STREETLIGHT": return "💡"
    case "WATER_SUPPLY": return "💧"
    case "WASTE_MANAGEMENT": return "🗑️"
    case "ROAD_DAMAGE": return "🚧"
    case "DRAINAGE": return "🌊"
    case "NOISE_POLLUTION": return "🔊"
    default: return "⚠️"
  }
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}