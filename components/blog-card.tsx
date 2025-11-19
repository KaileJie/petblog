import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"

export interface BlogCardProps {
  id: string
  title: string
  description: string
  author: string
  date: string
  likes: number
  comments: number
  imageUrl?: string
  slug: string
}

export function BlogCard({
  title,
  description,
  author,
  date,
  likes,
  comments,
  imageUrl,
  slug,
}: BlogCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {imageUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          <span>By {author}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </div>
        </div>
        <Link href={`/blogs/${slug}`}>
          <Button variant="outline" size="sm">
            Read More
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

