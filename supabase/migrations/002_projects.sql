-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  company_name TEXT DEFAULT '',
  company_logo_url TEXT DEFAULT '',
  product_name TEXT DEFAULT '',
  product_details TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  brand_tone TEXT DEFAULT '',
  product_photos JSONB DEFAULT '[]',
  reference_carousels JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_id to carousels if not exists
ALTER TABLE public.carousels ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Open policies for development
CREATE POLICY "Users can CRUD own projects" ON public.projects FOR ALL USING (true);

-- Ensure storage schema elements exist (in case storage isn't fully initialized)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('postify-assets', 'postify-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Open policies for storage bucket
CREATE POLICY "Public Select storage.objects" ON storage.objects FOR SELECT TO public USING (bucket_id = 'postify-assets');
CREATE POLICY "Public Insert storage.objects" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'postify-assets');
CREATE POLICY "Public Update storage.objects" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'postify-assets');
CREATE POLICY "Public Delete storage.objects" ON storage.objects FOR DELETE TO public USING (bucket_id = 'postify-assets');
