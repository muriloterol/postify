export interface Carousel {
  id: string;
  user_id: string;
  collection_id: string | null;
  brand_kit_id: string | null;
  project_id: string | null;
  title: string;
  theme: string;
  niche: string;
  audience: string;
  objective: CarouselObjective;
  tone: CarouselTone;
  visual_style: VisualStyle;
  format: CarouselFormat;
  status: CarouselStatus;
  caption: string;
  hashtags: string[];
  metadata: Record<string, unknown>;
  slides: Slide[];
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: string;
  carousel_id: string;
  slide_number: number;
  role: SlideRole;
  headline: string;
  subtitle: string;
  body: string;
  visual_direction: string;
  image_prompt: string;
  cta: string | null;
  canvas_data: Record<string, unknown> | null;
  background_type: BackgroundType;
  background_value: string;
  sort_order: number;
  created_at: string;
}

export type CarouselObjective = 'educar' | 'autoridade' | 'venda' | 'engajamento' | 'quebra_objecao';
export type CarouselTone = 'direto' | 'provocador' | 'premium' | 'didatico' | 'humanizado';
export type VisualStyle = 'minimalista_medico' | 'high_ticket_dark' | 'twitter_style' | 'varejo_promocional' | 'institucional_premium';
export type CarouselFormat = '1080x1350' | '1080x1080';
export type CarouselStatus = 'draft' | 'completed' | 'exported';
export type SlideRole = 'hook' | 'content' | 'authority' | 'proof' | 'cta' | 'transition';
export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface CarouselGenerationParams {
  theme: string;
  niche: string;
  audience: string;
  objective: CarouselObjective;
  tone: CarouselTone;
  visual_style: VisualStyle;
  format: CarouselFormat;
  slide_count: number;
  brand_kit_id?: string;
}

export interface GeneratedCarousel {
  title: string;
  theme: string;
  slides: GeneratedSlide[];
  caption: string;
  hashtags: string[];
}

export interface GeneratedSlide {
  slideNumber: number;
  role: SlideRole;
  headline: string;
  subtitle: string;
  body: string;
  visualDirection: string;
  imagePrompt: string;
  cta: string | null;
}
