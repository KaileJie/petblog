import { SiteHeader } from "@/components/header";
import { getBlogs } from "@/app/actions/blogs";
import { FeaturedBlogCard } from "@/components/featured-blog-card";
import { BlogCard } from "@/components/blog-card";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function extractDescription(content: string, subtitle: string | null): string {
  if (subtitle) return subtitle;
  // Remove HTML tags and get first 150 characters
  const textContent = content.replace(/<[^>]*>/g, "").trim();
  return textContent.length > 150 ? textContent.substring(0, 150) + "..." : textContent;
}

export default async function BlogsPage() {
  const { data: blogs, error } = await getBlogs();
  
  const featuredBlog = blogs && blogs.length > 0 ? blogs[0] : null;
  const otherBlogs = blogs && blogs.length > 1 ? blogs.slice(1) : [];

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
          {/* Page Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Pet Stories
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover heartwarming stories from our community
            </p>
          </div>

          {/* Featured Blog Section */}
          {featuredBlog && (
            <section className="mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-foreground">
                Featured Story
              </h2>
              <FeaturedBlogCard
                id={featuredBlog.id}
                title={featuredBlog.title}
                subtitle={featuredBlog.subtitle}
                description={extractDescription(featuredBlog.content, featuredBlog.subtitle)}
                author={featuredBlog.author}
                date={formatDate(featuredBlog.created_at)}
                likes={0}
                comments={0}
                imageUrl={featuredBlog.image}
                slug={featuredBlog.slug}
              />
            </section>
          )}

          {/* All Blogs Section */}
          {otherBlogs.length > 0 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-foreground">
                Latest Stories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {otherBlogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    id={blog.id}
                    title={blog.title}
                    description={extractDescription(blog.content, blog.subtitle)}
                    author={blog.author}
                    date={formatDate(blog.created_at)}
                    likes={0}
                    comments={0}
                    imageUrl={blog.image || undefined}
                    slug={blog.slug}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {(!blogs || blogs.length === 0) && !error && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
              <div className="mb-6">
                <span className="text-6xl">🐾</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                No Stories Yet
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Be the first to share your pet story with the community!
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
              <div className="mb-6">
                <span className="text-6xl">😿</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                Something went wrong
              </h2>
              <p className="text-muted-foreground max-w-md">
                {error}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

