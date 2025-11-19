import { getBlogById } from "@/app/actions/blogs"
import { notFound } from "next/navigation"
import { EditBlogForm } from "@/components/edit-blog-form"

interface EditBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params
  const result = await getBlogById(id)

  if (result.error || !result.data) {
    notFound()
  }

  return <EditBlogForm blog={result.data} />
}
