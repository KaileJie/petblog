import { BlogCard } from "@/components/blog-card"
import { getUserBlogs, getDashboardStats } from "@/app/actions/blogs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText, Eye, MessageCircle, Users } from "lucide-react"
import { DashboardStatsCard } from "@/components/dashboard-stats-card"
import { DashboardSearch } from "@/components/dashboard-search"
import { DashboardFilters } from "@/components/dashboard-filters"
import { Suspense } from "react"

function SearchAndFilters() {
  return (
    <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <DashboardSearch />
      <DashboardFilters />
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string }>
}) {
  const params = await searchParams
  const { data: blogs, error } = await getUserBlogs()
  const { data: stats } = await getDashboardStats()

  // Filter blogs based on search and filter params
  let filteredBlogs = blogs || []
  
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filteredBlogs = filteredBlogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchLower) ||
        (blog.subtitle && blog.subtitle.toLowerCase().includes(searchLower)) ||
        blog.content.toLowerCase().includes(searchLower)
    )
  }

  if (params.filter === "published") {
    // For now, all blogs are considered published
    // You can add a published field later
    filteredBlogs = filteredBlogs
  } else if (params.filter === "drafts") {
    // For now, no drafts
    filteredBlogs = []
  }

  // Get recent posts (limit to 6)
  const recentPosts = filteredBlogs.slice(0, 6)

  return (
    <div className="p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your blog.
          </p>
        </div>
        <Link href="/dashboard/blogs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Suspense fallback={<div className="mb-8 h-10" />}>
        <SearchAndFilters />
      </Suspense>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatsCard
          title="Total Posts"
          value={stats?.totalPosts || 0}
          icon={FileText}
        />
        <DashboardStatsCard
          title="Total Views"
          value={stats?.totalViews || 0}
          icon={Eye}
        />
        <DashboardStatsCard
          title="Comments"
          value={stats?.comments || 0}
          icon={MessageCircle}
        />
        <DashboardStatsCard
          title="Followers"
          value={stats?.followers || 0}
          icon={Users}
        />
      </div>

      {/* Recent Posts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Posts</h2>
          <Link href="/dashboard/blogs">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Error loading blogs: {error}</p>
          </div>
        ) : !recentPosts || recentPosts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">
              {params.search || params.filter
                ? "No posts match your filters."
                : "No posts yet. Create your first blog!"}
            </p>
            {!params.search && !params.filter && (
              <Link href="/dashboard/blogs/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                description={blog.subtitle || ""}
                author={blog.author}
                date={new Date(blog.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                likes={0}
                comments={0}
                imageUrl={blog.image || undefined}
                slug={blog.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
