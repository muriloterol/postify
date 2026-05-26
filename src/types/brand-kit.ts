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
