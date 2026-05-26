import { createClient } from '@/lib/supabase/client';
import { Carousel, Slide } from '@/types/carousel';
import { BrandKit, Collection, Template, Project } from '@/types/brand-kit';

const supabase = createClient();
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// ==========================================
// CAROUSELS & SLIDES
// ==========================================

export async function fetchCarousels(): Promise<Carousel[]> {
  const { data: carouselsData, error: carouselsError } = await supabase
    .from('carousels')
    .select('*')
    .order('created_at', { ascending: false });

  if (carouselsError) {
    console.error('Error fetching carousels:', carouselsError);
    return [];
  }

  const { data: slidesData, error: slidesError } = await supabase
    .from('slides')
    .select('*')
    .order('sort_order', { ascending: true });

  if (slidesError) {
    console.error('Error fetching slides:', slidesError);
    return [];
  }

  return carouselsData.map((carousel) => ({
    ...carousel,
    slides: slidesData.filter((s) => s.carousel_id === carousel.id),
  })) as Carousel[];
}

export async function fetchCarouselById(id: string): Promise<Carousel | null> {
  const { data: carouselData, error: carouselError } = await supabase
    .from('carousels')
    .select('*')
    .eq('id', id)
    .single();

  if (carouselError || !carouselData) {
    console.error('Error fetching carousel:', carouselError);
    return null;
  }

  const { data: slidesData, error: slidesError } = await supabase
    .from('slides')
    .select('*')
    .eq('carousel_id', id)
    .order('sort_order', { ascending: true });

  if (slidesError) {
    console.error('Error fetching slides:', slidesError);
    return null;
  }

  return {
    ...carouselData,
    slides: slidesData,
  } as Carousel;
}

export async function saveCarousel(carousel: Carousel): Promise<boolean> {
  const { slides, ...carouselData } = carousel;

  // Ensure default user_id is set
  carouselData.user_id = carouselData.user_id || DEFAULT_USER_ID;

  // Upsert carousel
  const { error: carouselError } = await supabase
    .from('carousels')
    .upsert(carouselData);

  if (carouselError) {
    console.error('Error saving carousel:', carouselError);
    return false;
  }

  // Delete existing slides first to avoid duplicate indices/keys
  const { error: deleteError } = await supabase
    .from('slides')
    .delete()
    .eq('carousel_id', carousel.id);

  if (deleteError) {
    console.error('Error clearing old slides:', deleteError);
    return false;
  }

  // Insert slides
  if (slides && slides.length > 0) {
    const slidesToInsert = slides.map((s, idx) => ({
      id: s.id,
      carousel_id: carousel.id,
      slide_number: s.slide_number,
      role: s.role,
      headline: s.headline,
      subtitle: s.subtitle,
      body: s.body,
      visual_direction: s.visual_direction,
      image_prompt: s.image_prompt,
      cta: s.cta,
      canvas_data: s.canvas_data,
      background_type: s.background_type,
      background_value: s.background_value,
      sort_order: idx,
    }));

    const { error: slidesError } = await supabase
      .from('slides')
      .insert(slidesToInsert);

    if (slidesError) {
      console.error('Error inserting slides:', slidesError);
      return false;
    }
  }

  return true;
}

export async function deleteCarousel(id: string): Promise<boolean> {
  const { error } = await supabase.from('carousels').delete().eq('id', id);
  if (error) {
    console.error('Error deleting carousel:', error);
    return false;
  }
  return true;
}

// ==========================================
// BRAND KITS
// ==========================================

export async function fetchBrandKits(): Promise<BrandKit[]> {
  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching brand kits:', error);
    return [];
  }

  return data as BrandKit[];
}

export async function saveBrandKit(kit: BrandKit): Promise<boolean> {
  const kitData = { ...kit, user_id: kit.user_id || DEFAULT_USER_ID };
  const { error } = await supabase.from('brand_kits').upsert(kitData);
  if (error) {
    console.error('Error saving brand kit:', error);
    return false;
  }
  return true;
}

export async function deleteBrandKit(id: string): Promise<boolean> {
  const { error } = await supabase.from('brand_kits').delete().eq('id', id);
  if (error) {
    console.error('Error deleting brand kit:', error);
    return false;
  }
  return true;
}

// ==========================================
// COLLECTIONS
// ==========================================

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }

  return data as Collection[];
}

export async function saveCollection(collection: Collection): Promise<boolean> {
  const collectionData = { ...collection, user_id: collection.user_id || DEFAULT_USER_ID };
  const { error } = await supabase.from('collections').upsert(collectionData);
  if (error) {
    console.error('Error saving collection:', error);
    return false;
  }
  return true;
}

export async function deleteCollection(id: string): Promise<boolean> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) {
    console.error('Error deleting collection:', error);
    return false;
  }
  return true;
}

// ==========================================
// TEMPLATES
// ==========================================

export async function fetchTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }

  return data as Template[];
}

export async function saveTemplate(template: Template): Promise<boolean> {
  const templateData = { ...template, user_id: template.user_id || DEFAULT_USER_ID };
  const { error } = await supabase.from('templates').upsert(templateData);
  if (error) {
    console.error('Error saving template:', error);
    return false;
  }
  return true;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) {
    console.error('Error deleting template:', error);
    return false;
  }
  return true;
}

// ==========================================
// PROJECTS
// ==========================================

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data as Project[];
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching project by id:', error);
    return null;
  }

  return data as Project;
}

export async function saveProject(project: Project): Promise<boolean> {
  const projectData = { ...project, user_id: project.user_id || DEFAULT_USER_ID };
  
  projectData.product_photos = projectData.product_photos || [];
  projectData.reference_carousels = projectData.reference_carousels || [];

  const { error } = await supabase.from('projects').upsert(projectData);
  if (error) {
    console.error('Error saving project:', error);
    return false;
  }
  return true;
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  return true;
}

export async function fetchCarouselsByProjectId(projectId: string): Promise<Carousel[]> {
  const { data: carouselsData, error: carouselsError } = await supabase
    .from('carousels')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (carouselsError) {
    console.error('Error fetching project carousels:', carouselsError);
    return [];
  }

  const { data: slidesData, error: slidesError } = await supabase
    .from('slides')
    .select('*')
    .order('sort_order', { ascending: true });

  if (slidesError) {
    console.error('Error fetching slides:', slidesError);
    return [];
  }

  return carouselsData.map((carousel) => ({
    ...carousel,
    slides: slidesData.filter((s) => s.carousel_id === carousel.id),
  })) as Carousel[];
}
