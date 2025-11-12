import { getPublicBlogBySlug } from "@/app/actions/blogs"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ArrowLeft } from "lucide-react"
import { deleteBlog } from "@/app/actions/blogs"
import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/header"

interface BlogDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const { data: blog, error } = await getPublicBlogBySlug(slug)

  if (error || !blog) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from("profiles").select("email").eq("id", user.id).single()
    : { data: null }

  // Check if the current user is the author
  const isAuthor = user && profile && profile.email === blog.author

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {isAuthor && (
            <div className="flex gap-2 mb-6">
              <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <form
                action={async () => {
                  "use server"
                  await deleteBlog(blog.id)
                  redirect("/")
                }}
              >
                <Button type="submit" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </form>
            </div>
          )}

          {blog.image && (
            <div className="w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <article className="prose prose-lg max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>
            {blog.subtitle && (
              <p className="text-xl text-muted-foreground mb-6">{blog.subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span>By {blog.author}</span>
              <span>•</span>
              <span>
                {new Date(blog.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </article>
        </div>
      </main>
    </>
  )
}
