export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  color_palette: string[];
  primary_font: string;
  secondary_font: string;
  tone_of_voice: string;
  forbidden_words: string[];
  writing_references: string;
  audience_description: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  carousel_count?: number;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  source_carousel_id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  template_data: Record<string, unknown>;
  created_at: string;
}

export interface ProjectAsset {
  url: string;
  name: string;
  size?: number;
  type?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  company_name: string;
  company_logo_url: string;
  product_name: string;
  product_details: string;
  target_audience: string;
  brand_tone: string;
  product_photos: ProjectAsset[];
  reference_carousels: ProjectAsset[];
  created_at: string;
  updated_at: string;
}
