import PetHero from "@/components/hero";
import { SiteHeader } from "@/components/header";
import { getBlogs } from "@/app/actions/blogs";
import { FeaturedBlogCard } from "@/components/featured-blog-card";
import { BlogCard } from "@/components/blog-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

export default async function Home() {
  const { data: blogs } = await getBlogs();
  
  // Get featured blogs for home page (first 3)
  const featuredBlogs = blogs && blogs.length > 0 ? blogs.slice(0, 3) : [];

  return (
    <>
      <SiteHeader />
      <PetHero />
      
      {/* Featured Stories Preview Section */}
      {featuredBlogs.length > 0 && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                  Featured Stories
                </h2>
                <p className="text-muted-foreground">
                  Discover heartwarming pet stories from our community
                </p>
              </div>
              <Link href="/blogs">
                <Button variant="outline" className="hidden sm:flex">
                  View All Stories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
              {featuredBlogs.map((blog) => (
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
            
            <div className="text-center sm:hidden">
              <Link href="/blogs">
                <Button variant="outline" className="w-full sm:w-auto">
                  View All Stories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
