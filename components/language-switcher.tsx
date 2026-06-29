// components/language-switcher.tsx
"use client"

import { useState } from "react"
import { SUPPORTED_LANGUAGES } from "@/lib/translate"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Languages } from "lucide-react"

interface Props {
  onTranslate: (lang: string) => void
  loading?: boolean
}

export function LanguageSwitcher({ onTranslate, loading }: Props) {
  const [lang, setLang] = useState("en")

  function handleChange(value: string) {
    setLang(value)
    onTranslate(value)
  }

  return (
    <div className="flex items-center gap-2">
      <Languages size={15} className="text-muted-foreground" />
      <Select value={lang} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code} className="text-xs">
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}