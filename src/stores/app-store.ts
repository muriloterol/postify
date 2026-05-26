import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrandKit, Collection } from '@/types/brand-kit';
import { Carousel } from '@/types/carousel';

interface AppState {
  // Data
  carousels: Carousel[];
  brandKits: BrandKit[];
  collections: Collection[];

  // UI
  sidebarCollapsed: boolean;
  isLoading: boolean;

  // Settings
  aiProvider: 'mock' | 'openai' | 'gemini';
  apiKey: string;

  // Actions
  setCarousels: (carousels: Carousel[]) => void;
  addCarousel: (carousel: Carousel) => void;
  removeCarousel: (id: string) => void;
  updateCarousel: (id: string, updates: Partial<Carousel>) => void;

  setBrandKits: (kits: BrandKit[]) => void;
  addBrandKit: (kit: BrandKit) => void;
  removeBrandKit: (id: string) => void;

  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  removeCollection: (id: string) => void;

  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  setAiProvider: (provider: 'mock' | 'openai' | 'gemini') => void;
  setApiKey: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      carousels: [],
      brandKits: [],
      collections: [],
      sidebarCollapsed: false,
      isLoading: false,
      aiProvider: 'mock',
      apiKey: '',

      setCarousels: (carousels) => set({ carousels }),
      addCarousel: (carousel) => set({ carousels: [carousel, ...get().carousels] }),
      removeCarousel: (id) => set({ carousels: get().carousels.filter(c => c.id !== id) }),
      updateCarousel: (id, updates) => set({
        carousels: get().carousels.map(c => c.id === id ? { ...c, ...updates } : c),
      }),

      setBrandKits: (brandKits) => set({ brandKits }),
      addBrandKit: (kit) => set({ brandKits: [kit, ...get().brandKits] }),
      removeBrandKit: (id) => set({ brandKits: get().brandKits.filter(k => k.id !== id) }),

      setCollections: (collections) => set({ collections }),
      addCollection: (collection) => set({ collections: [collection, ...get().collections] }),
      removeCollection: (id) => set({ collections: get().collections.filter(c => c.id !== id) }),

      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setLoading: (isLoading) => set({ isLoading }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: 'postify-app-settings',
      partialize: (state) => ({
        aiProvider: state.aiProvider,
        apiKey: state.apiKey,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
