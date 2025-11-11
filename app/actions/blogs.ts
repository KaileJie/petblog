"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { BlogInsert, BlogUpdate } from "@/types/blog"

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// Create a new blog
export async function createBlog(data: Omit<BlogInsert, "slug" | "author">) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // Get user email for author field
  let { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist, create it automatically
  if (!profile) {
    // Get email from auth user (we already have user, but need email)
    if (!user.email) {
      return { error: "Unable to get user email" }
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
      })
      .select("email")
      .single()

    if (profileError || !newProfile) {
      return { error: "Failed to create profile. Please try signing out and signing in again." }
    }

    profile = newProfile
  }

  // Generate slug
  let slug = generateSlug(data.title)
  
  // Check if slug exists and append number if needed
  let counter = 0
  let finalSlug = slug
  while (true) {
    const { data: existing } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", finalSlug)
      .single()
    
    if (!existing) break
    counter++
    finalSlug = `${slug}-${counter}`
  }

  const blogData: BlogInsert = {
    ...data,
    slug: finalSlug,
    author: profile.email,
  }

  const { data: blog, error } = await supabase
    .from("blogs")
    .insert(blogData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/blogs")
  revalidatePath(`/blogs/${finalSlug}`)
  
  return { data: blog }
}

// Get all blogs
export async function getBlogs() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

// Get a single blog by slug
export async function getBlogBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

// Get a single blog by ID
export async function getBlogById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

// Update a blog
export async function updateBlog(id: string, data: BlogUpdate) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // Get user email for author field
  let { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist, create it automatically
  if (!profile) {
    // Get email from auth user (we already have user, but need email)
    if (!user.email) {
      return { error: "Unable to get user email" }
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
      })
      .select("email")
      .single()

    if (profileError || !newProfile) {
      return { error: "Failed to create profile. Please try signing out and signing in again." }
    }

    profile = newProfile
  }

  // Check if user owns the blog
  const { data: blog } = await supabase
    .from("blogs")
    .select("author")
    .eq("id", id)
    .single()

  if (!blog || blog.author !== profile.email) {
    return { error: "Unauthorized: You can only update your own blogs" }
  }

  // If title is being updated, regenerate slug
  let updateData = { ...data }
  if (data.title) {
    let slug = generateSlug(data.title)
    
    // Check if slug exists (excluding current blog)
    let counter = 0
    let finalSlug = slug
    while (true) {
      const { data: existing } = await supabase
        .from("blogs")
        .select("id")
        .eq("slug", finalSlug)
        .neq("id", id)
        .single()
      
      if (!existing) break
      counter++
      finalSlug = `${slug}-${counter}`
    }
    
    updateData.slug = finalSlug
  }

  const { data: updatedBlog, error } = await supabase
    .from("blogs")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/blogs")
  revalidatePath(`/blogs/${updatedBlog.slug}`)
  
  return { data: updatedBlog }
}

// Delete a blog
export async function deleteBlog(id: string) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // Get user email for author field
  let { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist, create it automatically
  if (!profile) {
    // Get email from auth user (we already have user, but need email)
    if (!user.email) {
      return { error: "Unable to get user email" }
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
      })
      .select("email")
      .single()

    if (profileError || !newProfile) {
      return { error: "Failed to create profile. Please try signing out and signing in again." }
    }

    profile = newProfile
  }

  // Check if user owns the blog
  const { data: blog } = await supabase
    .from("blogs")
    .select("author, slug")
    .eq("id", id)
    .single()

  if (!blog || blog.author !== profile.email) {
    return { error: "Unauthorized: You can only delete your own blogs" }
  }

  const { error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/blogs")
  revalidatePath(`/blogs/${blog.slug}`)
  
  return { success: true }
}

