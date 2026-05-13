"use client"

import { SearchBox } from "@/components/ui/SearchBox"

interface TopbarProps {
  showSearch?:    boolean
  searchValue?:   string
  onSearchChange?: (v: string) => void
  /** name = typed/selected text; domain = set when picked from dropdown */
  onSearchSubmit?: (name: string, domain?: string) => void
  onSearchClear?:  () => void
}

export function Topbar({
  showSearch = false,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
}: TopbarProps) {
  if (!showSearch) return null

  return (
    <header
      className="flex items-center justify-center px-4 md:px-7 py-2.5 flex-shrink-0"
      style={{ minHeight: 56 }}
    >
      <div className="w-full max-w-xl">
        <SearchBox
          value={searchValue}
          size="sm"
          onChange={v => {
            onSearchChange?.(v)
            if (!v) onSearchClear?.()
          }}
          onSearch={(name, domain) => onSearchSubmit?.(name, domain)}
        />
      </div>
    </header>
  )
}
