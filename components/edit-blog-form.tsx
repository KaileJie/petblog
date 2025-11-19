"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TipTapEditor } from "@/components/tiptap-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateBlog } from "@/app/actions/blogs"
import { Loader2 } from "lucide-react"
import { Blog } from "@/types/blog"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { createClient } from "@/lib/supabase/client"

interface EditBlogFormProps {
  blog: Blog
}

export function EditBlogForm({ blog }: EditBlogFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: blog.title,
    subtitle: blog.subtitle || "",
    image: blog.image || "",
    content: blog.content,
  })

  // Get user ID for organizing uploads
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  // Configure dropzone for blog images
  const dropzoneProps = useSupabaseUpload({
    bucketName: 'blog-images',
    path: userId || undefined,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  })

  // Handle successful upload and get public URL
  useEffect(() => {
    if (dropzoneProps.isSuccess && dropzoneProps.successes.length > 0 && userId) {
      const originalFileName = dropzoneProps.successes[0]
      const sanitizedFileName = dropzoneProps.uploadedFileNames.get(originalFileName) || originalFileName
      const supabase = createClient()
      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`${userId}/${sanitizedFileName}`)
      
      if (data && data.publicUrl) {
        setFormData(prev => ({ ...prev, image: data.publicUrl }))
      }
    }
  }, [dropzoneProps.isSuccess, dropzoneProps.successes, dropzoneProps.uploadedFileNames, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required")
      setIsSubmitting(false)
      return
    }

    try {
      const result = await updateBlog(blog.id, {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image: formData.image || null,
        content: formData.content,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Reset dropzone after successful submission
        dropzoneProps.setFiles([])
        dropzoneProps.setErrors([])
        router.push("/dashboard/blogs")
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold mb-8">Edit Blog</h1>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter blog title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Enter blog subtitle (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Cover Image</Label>
          <Dropzone {...dropzoneProps} className="w-full">
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
          {formData.image && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Selected image:</p>
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setFormData(prev => ({ ...prev, image: "" }))
                  dropzoneProps.setFiles([])
                  dropzoneProps.setErrors([])
                }}
              >
                Remove Image
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <TipTapEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Start writing your blog post..."
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Blog"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

