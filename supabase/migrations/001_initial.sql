-- Postify Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Kits
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  color_palette JSONB DEFAULT '[]',
  primary_font TEXT DEFAULT 'Inter',
  secondary_font TEXT DEFAULT 'DM Sans',
  tone_of_voice TEXT DEFAULT 'direto',
  forbidden_words TEXT[] DEFAULT '{}',
  writing_references TEXT DEFAULT '',
  audience_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6C5CE7',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carousels
CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  brand_kit_id UUID REFERENCES brand_kits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  niche TEXT DEFAULT '',
  audience TEXT DEFAULT '',
  objective TEXT DEFAULT 'educar',
  tone TEXT DEFAULT 'direto',
  visual_style TEXT DEFAULT 'high_ticket_dark',
  format TEXT DEFAULT '1080x1350',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'exported')),
  caption TEXT DEFAULT '',
  hashtags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slides
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carousel_id UUID NOT NULL REFERENCES carousels(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  role TEXT DEFAULT 'content' CHECK (role IN ('hook', 'content', 'authority', 'proof', 'cta', 'transition')),
  headline TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  body TEXT DEFAULT '',
  visual_direction TEXT DEFAULT '',
  image_prompt TEXT DEFAULT '',
  cta TEXT,
  canvas_data JSONB,
  background_type TEXT DEFAULT 'gradient' CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_value TEXT DEFAULT 'linear-gradient(135deg, #1A1A2E, #2D2D44)',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_carousel_id UUID REFERENCES carousels(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  thumbnail_url TEXT,
  template_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carousels_user_id ON carousels(user_id);
CREATE INDEX IF NOT EXISTS idx_carousels_collection_id ON carousels(collection_id);
CREATE INDEX IF NOT EXISTS idx_carousels_status ON carousels(status);
CREATE INDEX IF NOT EXISTS idx_slides_carousel_id ON slides(carousel_id);
CREATE INDEX IF NOT EXISTS idx_slides_sort_order ON slides(carousel_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON brand_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policies (user can only access own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own brand_kits" ON brand_kits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own collections" ON collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own carousels" ON carousels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own templates" ON templates FOR ALL USING (auth.uid() = user_id);

-- Slides policy: user can access slides of their own carousels
CREATE POLICY "Users can CRUD slides of own carousels" ON slides FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM carousels WHERE carousels.id = slides.carousel_id AND carousels.user_id = auth.uid()
  )
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for carousels
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON carousels;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON carousels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
