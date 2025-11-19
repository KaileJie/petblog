-- Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subtitle TEXT,
  image TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can view blogs
CREATE POLICY "Anyone can view blogs"
  ON public.blogs
  FOR SELECT
  USING (true);

-- Create policy: Authenticated users can create blogs
CREATE POLICY "Authenticated users can create blogs"
  ON public.blogs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy: Users can update their own blogs (based on author matching profile)
-- Note: Policies that reference profiles will be created after profiles table exists
-- See migration 20251107141118_create_profiles_table.sql for policy creation

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug_text TEXT;
  base_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(title_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  slug_text := base_slug;
  
  -- Check if slug exists, if so append counter
  WHILE EXISTS (SELECT 1 FROM public.blogs WHERE slug = slug_text) LOOP
    counter := counter + 1;
    slug_text := base_slug || '-' || counter;
  END LOOP;
  
  RETURN slug_text;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on blog update
CREATE TRIGGER on_blog_updated
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.handle_blog_updated_at();

