import { create } from 'zustand';
import { Carousel, Slide } from '@/types/carousel';

interface EditorState {
  carousel: Carousel | null;
  activeSlideIndex: number;
  selectedObjectId: string | null;
  zoom: number;
  isDirty: boolean;
  isExporting: boolean;
  isSaving: boolean;

  // Actions
  setCarousel: (carousel: Carousel) => void;
  setActiveSlide: (index: number) => void;
  setSelectedObject: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setDirty: (dirty: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setSaving: (saving: boolean) => void;

  // Slide operations
  updateSlide: (index: number, updates: Partial<Slide>) => void;
  addSlide: (slide: Slide) => void;
  removeSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  updateSlideCanvasData: (index: number, canvasData: Record<string, unknown>) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  carousel: null,
  activeSlideIndex: 0,
  selectedObjectId: null,
  zoom: 0.5,
  isDirty: false,
  isExporting: false,
  isSaving: false,

  setCarousel: (carousel) => set({ carousel, isDirty: false }),
  setActiveSlide: (index) => set({ activeSlideIndex: index, selectedObjectId: null }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(2, zoom)) }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setSaving: (saving) => set({ isSaving: saving }),

  updateSlide: (index, updates) => {
    const { carousel } = get();
    if (!carousel) return;
    const slides = [...carousel.slides];
    slides[index] = { ...slides[index], ...updates };
    set({ carousel: { ...carousel, slides }, isDirty: true });
  },

  addSlide: (slide) => {
    const { carousel } = get();
    if (!carousel) return;
    const slides = [...carousel.slides, slide];
    set({ carousel: { ...carousel, slides }, isDirty: true });
  },

  removeSlide: (index) => {
    const { carousel, activeSlideIndex } = get();
    if (!carousel || carousel.slides.length <= 1) return;
    const slides = carousel.slides.filter((_, i) => i !== index);
    const newActive = activeSlideIndex >= slides.length ? slides.length - 1 : activeSlideIndex;
    set({ carousel: { ...carousel, slides }, activeSlideIndex: newActive, isDirty: true });
  },

  duplicateSlide: (index) => {
    const { carousel } = get();
    if (!carousel) return;
    const sourceSlide = carousel.slides[index];
    const newSlide: Slide = {
      ...sourceSlide,
      id: crypto.randomUUID(),
      slide_number: carousel.slides.length + 1,
      sort_order: carousel.slides.length,
    };
    const slides = [...carousel.slides];
    slides.splice(index + 1, 0, newSlide);
    set({
      carousel: { ...carousel, slides },
      activeSlideIndex: index + 1,
      isDirty: true,
    });
  },

  reorderSlides: (fromIndex, toIndex) => {
    const { carousel } = get();
    if (!carousel) return;
    const slides = [...carousel.slides];
    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);
    const reordered = slides.map((s, i) => ({ ...s, sort_order: i, slide_number: i + 1 }));
    set({ carousel: { ...carousel, slides: reordered }, isDirty: true });
  },

  updateSlideCanvasData: (index, canvasData) => {
    const { carousel } = get();
    if (!carousel) return;
    const slides = [...carousel.slides];
    slides[index] = { ...slides[index], canvas_data: canvasData };
    set({ carousel: { ...carousel, slides }, isDirty: true });
  },
}));
