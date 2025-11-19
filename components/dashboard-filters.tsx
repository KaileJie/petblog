"use client"

import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"
import { cn } from "@/lib/utils"

type FilterType = "all" | "published" | "drafts"

export function DashboardFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentFilter = (searchParams.get("filter") || "all") as FilterType

  const handleFilter = useCallback(
    (filter: FilterType) => {
      const params = new URLSearchParams(searchParams.toString())
      if (filter === "all") {
        params.delete("filter")
      } else {
        params.set("filter", filter)
      }
      router.replace(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  return (
    <div className="flex gap-2">
      <Button
        variant={currentFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilter("all")}
        className={cn(
          currentFilter === "all" && "bg-primary text-primary-foreground"
        )}
      >
        All Posts
      </Button>
      <Button
        variant={currentFilter === "published" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilter("published")}
        className={cn(
          currentFilter === "published" && "bg-primary text-primary-foreground"
        )}
      >
        Published
      </Button>
      <Button
        variant={currentFilter === "drafts" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilter("drafts")}
        className={cn(
          currentFilter === "drafts" && "bg-primary text-primary-foreground"
        )}
      >
        Drafts
      </Button>
    </div>
  )
}

