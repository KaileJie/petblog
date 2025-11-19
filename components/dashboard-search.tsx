"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"

export function DashboardSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, router, pathname]
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search blog posts..."
        className="pl-9 w-full max-w-sm"
        defaultValue={searchParams.get("search") || ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  )
}

