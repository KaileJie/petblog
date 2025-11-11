-- Create storage bucket for blog post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to blog images
CREATE POLICY "Public can view blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');

-- Policy: Allow authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update their own blog images
CREATE POLICY "Authenticated users can update own blog images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
  AND owner = auth.uid()
);

-- Policy: Allow authenticated users to delete their own blog images
CREATE POLICY "Authenticated users can delete own blog images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
  AND owner = auth.uid()
);

