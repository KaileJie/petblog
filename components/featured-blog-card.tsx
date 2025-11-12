import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Heart, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export interface FeaturedBlogCardProps {
  id: string
  title: string
  subtitle: string | null
  description: string
  author: string
  date: string
  likes: number
  comments: number
  imageUrl?: string | null
  slug: string
}

export function FeaturedBlogCard({
  title,
  subtitle,
  description,
  author,
  date,
  likes,
  comments,
  imageUrl,
  slug,
}: FeaturedBlogCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2">
      <div className={`grid ${imageUrl ? 'md:grid-cols-2' : ''} gap-0`}>
        {imageUrl && (
          <div className="w-full h-64 md:h-full min-h-[300px] overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="flex flex-col">
          <CardHeader className="flex-1 pb-4">
            <div className="mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                Featured Story
              </span>
            </div>
            <CardTitle className="text-2xl md:text-3xl lg:text-4xl mb-3 line-clamp-2">
              {title}
            </CardTitle>
            {subtitle && (
              <CardDescription className="text-base md:text-lg mb-4 line-clamp-2">
                {subtitle}
              </CardDescription>
            )}
            <CardDescription className="text-sm md:text-base line-clamp-3">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span className="font-medium">By {author}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span>{comments}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <Link href={`/blogs/${slug}`} className="w-full">
              <Button 
                size="lg" 
                className="w-full group"
                variant="default"
              >
                Read Full Story
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}

