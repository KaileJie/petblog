import { BlogCard } from "@/components/blog-card"
import { getBlogs } from "@/app/actions/blogs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function DashboardPage() {
  const { data: blogs, error } = await getBlogs()

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground">
          Discover amazing pet stories from our community
        </p>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Error loading blogs: {error}</p>
        </div>
      ) : !blogs || blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No blogs yet. Create your first blog!</p>
          <Link href="/dashboard/blogs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Blog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
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
  )
}
