'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Save,
  Download,
  ArrowLeft,
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Loader2,
  GripVertical,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { Carousel, Slide } from '@/types/carousel';
import { VISUAL_STYLES, SLIDE_DIMENSIONS } from '@/lib/constants';
import { fetchCarouselById, saveCarousel, fetchBrandKits } from '@/services/db-service';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const carouselId = params.id as string;

  const {
    carousel,
    activeSlideIndex,
    zoom,
    isDirty,
    isSaving,
    isExporting,
    setCarousel,
    setActiveSlide,
    setZoom,
    setSaving,
    setExporting,
    updateSlide,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedElement, setSelectedElement] = useState<'headline' | 'subtitle' | 'body' | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const [brandKit, setBrandKit] = useState<any>(null);

  // Load carousel from Supabase (with localStorage fallback)
  useEffect(() => {
    async function loadCarousel() {
      const dbCarousel = await fetchCarouselById(carouselId);
      if (dbCarousel) {
        setCarousel(dbCarousel);
        if (dbCarousel.brand_kit_id) {
          try {
            const kits = await fetchBrandKits();
            const match = kits.find(k => k.id === dbCarousel.brand_kit_id);
            if (match) setBrandKit(match);
          } catch (e) {
            console.error('Error loading brand kit:', e);
          }
        }
      } else {
        const stored = localStorage.getItem(`carousel_${carouselId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCarousel(parsed);
          if (parsed.brand_kit_id) {
            try {
              const kits = await fetchBrandKits();
              const match = kits.find(k => k.id === parsed.brand_kit_id);
              if (match) setBrandKit(match);
            } catch (e) {}
          }
        } else {
          router.push('/dashboard');
        }
      }
    }
    loadCarousel();
  }, [carouselId, setCarousel, router]);

  // Auto-save to localStorage
  useEffect(() => {
    if (carousel && isDirty) {
      const timeout = setTimeout(() => {
        localStorage.setItem(`carousel_${carouselId}`, JSON.stringify(carousel));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [carousel, isDirty, carouselId]);

  const handleSave = useCallback(async () => {
    if (!carousel) return;
    setSaving(true);
    const success = await saveCarousel(carousel);
    if (success) {
      localStorage.setItem(`carousel_${carouselId}`, JSON.stringify(carousel));
    }
    setSaving(false);
  }, [carousel, carouselId, setSaving]);

  const handleExport = useCallback(async () => {
    if (!carousel) return;
    setExporting(true);

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();

      const dimensions = SLIDE_DIMENSIONS[carousel.format as keyof typeof SLIDE_DIMENSIONS] || SLIDE_DIMENSIONS['1080x1350'];

      for (let i = 0; i < carousel.slides.length; i++) {
        const slide = carousel.slides[i];
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const ctx = canvas.getContext('2d')!;

        // Draw background
        const bgValue = slide.background_value;
        if (bgValue.startsWith('linear-gradient')) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          const colors = bgValue.match(/#[0-9A-Fa-f]{6}/g) || ['#1A1A2E', '#2D2D44'];
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1] || colors[0]);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = bgValue || '#1A1A2E';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Determine text color based on background
        const style = VISUAL_STYLES.find(s => s.value === carousel.visual_style);
        const textColor = style?.colors[3] || style?.colors[2] || '#FFFFFF';
        const subtitleColor = style?.colors[2] || '#CCCCCC';
        const primaryFont = brandKit?.primary_font || 'Inter';

        const layout = (slide.canvas_data?.layout as string) || 'clean';

        if (layout === 'cover') {
          // 1. COVER LAYOUT
          // Niche Tag
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(80, 80, 200, 48, 24);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = textColor;
          ctx.font = `bold 18px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText((carousel.niche || 'Instagram').toUpperCase(), 180, 110);

          // Format tag
          ctx.fillStyle = subtitleColor;
          ctx.font = `bold 16px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillText(carousel.format, canvas.width - 80, 110);

          // Headline
          ctx.fillStyle = textColor;
          ctx.font = `bold 56px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'left';
          const headlineLines = wrapText(ctx, slide.headline, canvas.width - 160);
          const startY = canvas.height / 2 - (headlineLines.length * 66) / 2;
          headlineLines.forEach((line, li) => {
            ctx.fillText(line, 80, startY + li * 66);
          });

          // Subtitle
          if (slide.subtitle) {
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 28px "${primaryFont}", sans-serif`;
            const subtitleLines = wrapText(ctx, slide.subtitle, canvas.width - 160);
            const subtitleY = startY + headlineLines.length * 66 + 30;
            subtitleLines.forEach((line, li) => {
              ctx.fillText(line, 80, subtitleY + li * 38);
            });
          }

          // Footer Line and indicator
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.moveTo(80, canvas.height - 120);
          ctx.lineTo(canvas.width - 80, canvas.height - 120);
          ctx.stroke();

          ctx.fillStyle = subtitleColor;
          ctx.font = `bold 16px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText('ARRASSAR PARA O LADO ➔', 80, canvas.height - 80);

        } else if (layout === 'big_number') {
          // 2. BIG NUMBER LAYOUT
          // Giant number
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.font = '900 240px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(String(slide.slide_number).padStart(2, '0'), canvas.width - 80, 260);

          // Role Badge
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.roundRect(80, 80, 120, 36, 8);
          ctx.fill();
          ctx.fillStyle = textColor;
          ctx.font = `bold 14px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`PASSO ${slide.slide_number}`, 140, 103);

          // Content
          ctx.textAlign = 'left';
          const headlineLines = wrapText(ctx, slide.headline, canvas.width - 160);
          const startY = 320;
          
          ctx.fillStyle = textColor;
          ctx.font = `bold 42px "${primaryFont}", sans-serif`;
          headlineLines.forEach((line, li) => {
            ctx.fillText(line, 80, startY + li * 52);
          });

          const subtitleY = startY + headlineLines.length * 52 + 20;
          if (slide.subtitle) {
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 24px "${primaryFont}", sans-serif`;
            const subtitleLines = wrapText(ctx, slide.subtitle, canvas.width - 160);
            subtitleLines.forEach((line, li) => {
              ctx.fillText(line, 80, subtitleY + li * 32);
            });
          }

          if (slide.body) {
            const bodyY = subtitleY + (slide.subtitle ? 100 : 40);
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 20px "${primaryFont}", sans-serif`;
            const bodyLines = wrapText(ctx, slide.body, canvas.width - 160);
            bodyLines.forEach((line, li) => {
              ctx.fillText(line, 80, bodyY + li * 28);
            });
          }

        } else if (layout === 'split') {
          // 3. SPLIT SCREEN LAYOUT
          // Draw split box in top half
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.roundRect(80, 100, canvas.width - 160, canvas.height / 2 - 140, 24);
          ctx.fill();
          ctx.stroke();

          // Subtitle in split box
          ctx.fillStyle = textColor;
          ctx.font = `italic bold 28px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'left';
          const subtitleLines = wrapText(ctx, slide.subtitle || 'Destaque', canvas.width - 220);
          subtitleLines.forEach((line, li) => {
            ctx.fillText(line, 120, 160 + li * 36);
          });

          // Headline in bottom half
          ctx.fillStyle = textColor;
          ctx.font = `bold 40px "${primaryFont}", sans-serif`;
          const headlineLines = wrapText(ctx, slide.headline, canvas.width - 160);
          const startY = canvas.height / 2 + 20;
          headlineLines.forEach((line, li) => {
            ctx.fillText(line, 80, startY + li * 48);
          });

          if (slide.body) {
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 20px "${primaryFont}", sans-serif`;
            const bodyY = startY + headlineLines.length * 48 + 20;
            const bodyLines = wrapText(ctx, slide.body, canvas.width - 160);
            bodyLines.forEach((line, li) => {
              ctx.fillText(line, 80, bodyY + li * 28);
            });
          }

        } else if (layout === 'quote') {
          // 4. QUOTE LAYOUT
          // Quote Mark
          ctx.fillStyle = textColor;
          ctx.font = 'italic 120px Georgia, serif';
          ctx.textAlign = 'left';
          ctx.fillText('“', 80, 180);

          // Content
          ctx.textAlign = 'center';
          ctx.font = `italic 32px "${primaryFont}", sans-serif`;
          const headlineLines = wrapText(ctx, slide.headline, canvas.width - 200);
          const startY = canvas.height / 2 - (headlineLines.length * 46) / 2;
          headlineLines.forEach((line, li) => {
            ctx.fillText(line, canvas.width / 2, startY + li * 46);
          });

          // Signature footer
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - 100, canvas.height - 180);
          ctx.lineTo(canvas.width / 2 + 100, canvas.height - 180);
          ctx.stroke();

          ctx.fillStyle = textColor;
          ctx.font = `bold 20px "${primaryFont}", sans-serif`;
          ctx.fillText(brandKit?.name || 'Postify Studio', canvas.width / 2, canvas.height - 140);
          
          ctx.fillStyle = subtitleColor;
          ctx.font = `16px "${primaryFont}", sans-serif`;
          const handle = brandKit?.name ? brandKit.name.toLowerCase().replace(/\s/g, '') : 'postify';
          ctx.fillText(`@${handle}`, canvas.width / 2, canvas.height - 110);

        } else if (layout === 'cta') {
          // 5. CTA LAYOUT
          ctx.textAlign = 'center';
          ctx.fillStyle = subtitleColor;
          ctx.font = `bold 16px "${primaryFont}", sans-serif`;
          ctx.fillText('PRONTO PARA APLICAR?', canvas.width / 2, 100);

          // Headline
          ctx.fillStyle = textColor;
          ctx.font = `bold 48px "${primaryFont}", sans-serif`;
          const headlineLines = wrapText(ctx, slide.headline, canvas.width - 160);
          const startY = canvas.height / 2 - 120;
          headlineLines.forEach((line, li) => {
            ctx.fillText(line, canvas.width / 2, startY + li * 56);
          });

          // Subtitle
          if (slide.subtitle) {
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 24px "${primaryFont}", sans-serif`;
            const subtitleY = startY + headlineLines.length * 56 + 20;
            const subtitleLines = wrapText(ctx, slide.subtitle, canvas.width - 160);
            subtitleLines.forEach((line, li) => {
              ctx.fillText(line, canvas.width / 2, subtitleY + li * 32);
            });
          }

          // CTA Pill Button
          if (slide.cta) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            const ctaWidth = ctx.measureText(slide.cta).width + 60;
            ctx.beginPath();
            ctx.roundRect(
              (canvas.width - ctaWidth) / 2,
              canvas.height - 240,
              ctaWidth,
              56,
              28
            );
            ctx.fill();
            ctx.fillStyle = textColor;
            ctx.font = `bold 20px "${primaryFont}", sans-serif`;
            ctx.fillText(slide.cta, canvas.width / 2, canvas.height - 204);
          }

          // Handle Footer
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - 100, canvas.height - 120);
          ctx.lineTo(canvas.width / 2 + 100, canvas.height - 120);
          ctx.stroke();

          ctx.fillStyle = subtitleColor;
          ctx.font = `bold 16px "${primaryFont}", sans-serif`;
          const handle = brandKit?.name ? brandKit.name.toLowerCase().replace(/\s/g, '') : 'seuprofile';
          ctx.fillText(`@${handle}`, canvas.width / 2, canvas.height - 80);

        } else {
          // 6. CLEAN / MINIMALIST LAYOUT (Default)
          // Header slide number
          ctx.fillStyle = textColor;
          ctx.font = `bold 20px "${primaryFont}", sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`0${slide.slide_number}`, 80, 100);

          // Accent dot
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.arc(canvas.width - 80, 92, 4, 0, Math.PI * 2);
          ctx.fill();

          // Content
          ctx.fillStyle = textColor;
          ctx.font = `bold 48px "${primaryFont}", sans-serif`;
          const headlineLines = wrapText(ctx, slide.headline, canvas.width - 160);
          const startY = canvas.height / 2 - 120;
          headlineLines.forEach((line, li) => {
            ctx.fillText(line, 80, startY + li * 56);
          });

          const subtitleY = startY + headlineLines.length * 56 + 20;
          if (slide.subtitle) {
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 24px "${primaryFont}", sans-serif`;
            const subtitleLines = wrapText(ctx, slide.subtitle, canvas.width - 160);
            subtitleLines.forEach((line, li) => {
              ctx.fillText(line, 80, subtitleY + li * 32);
            });
          }

          if (slide.body) {
            const bodyY = subtitleY + (slide.subtitle ? 80 : 30);
            ctx.fillStyle = subtitleColor;
            ctx.font = `400 18px "${primaryFont}", sans-serif`;
            const bodyLines = wrapText(ctx, slide.body, canvas.width - 160);
            bodyLines.forEach((line, li) => {
              ctx.fillText(line, 80, bodyY + li * 26);
            });
          }
        }

        // Convert to blob
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png', 1.0)
        );
        zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${carousel.title.replace(/\s+/g, '_')}.zip`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [carousel, setExporting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
      if (e.key === 'Delete' && !editingField) {
        // Could delete selected element
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, editingField]);

  if (!carousel) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const activeSlide = carousel.slides[activeSlideIndex];
  const dimensions = SLIDE_DIMENSIONS[carousel.format as keyof typeof SLIDE_DIMENSIONS] || SLIDE_DIMENSIONS['1080x1350'];
  const style = VISUAL_STYLES.find(s => s.value === carousel.visual_style);
  const textColor = style?.colors[3] || style?.colors[2] || '#FFFFFF';
  const subtitleColor = style?.colors[2] || '#CCCCCC';
  const primaryFont = brandKit?.primary_font || 'Inter';
  const secondaryFont = brandKit?.secondary_font || 'Inter';

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--background-secondary)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--foreground-muted)]" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-[var(--foreground)] truncate max-w-[300px]">
              {carousel.title}
            </h1>
            <p className="text-[10px] text-[var(--foreground-muted)]">
              {carousel.slides.length} slides • {carousel.format}
            </p>
          </div>
          {isDirty && (
            <span className="text-[10px] text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-full font-medium">
              Não salvo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-gradient flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isExporting ? 'Exportando...' : 'Exportar ZIP'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Slides */}
        <div className="w-[200px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--background-secondary)] flex flex-col">
          <div className="p-3 border-b border-[var(--border)]">
            <span className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
              Slides ({carousel.slides.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carousel.slides.map((slide, index) => (
              <div key={slide.id} className="group relative">
                <button
                  onClick={() => setActiveSlide(index)}
                  className={cn(
                    'slide-thumbnail w-full',
                    activeSlideIndex === index && 'active'
                  )}
                >
                  <div
                    className="w-full rounded-md overflow-hidden"
                    style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }}
                  >
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-3"
                      style={{
                        background: slide.background_value.startsWith('linear')
                          ? slide.background_value
                          : slide.background_value,
                      }}
                    >
                      <span
                        className="text-[8px] font-bold text-center leading-tight line-clamp-3"
                        style={{ color: textColor }}
                      >
                        {slide.headline}
                      </span>
                    </div>
                  </div>

                  {/* Slide number */}
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                    {index + 1}
                  </div>

                  {/* Role badge */}
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-medium text-white capitalize">
                    {slide.role}
                  </div>
                </button>

                {/* Hover actions */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateSlide(index); }}
                    className="p-0.5 rounded bg-black/60 backdrop-blur-sm text-white/70 hover:text-white"
                    title="Duplicar"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {carousel.slides.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSlide(index); }}
                      className="p-0.5 rounded bg-black/60 backdrop-blur-sm text-red-400 hover:text-red-300"
                      title="Excluir"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Slide */}
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={() => {
                const newSlide: Slide = {
                  id: crypto.randomUUID(),
                  carousel_id: carousel.id,
                  slide_number: carousel.slides.length + 1,
                  role: 'content',
                  headline: 'Novo Slide',
                  subtitle: 'Subtítulo aqui',
                  body: '',
                  visual_direction: '',
                  image_prompt: '',
                  cta: null,
                  canvas_data: null,
                  background_type: 'gradient',
                  background_value: activeSlide?.background_value || 'linear-gradient(135deg, #1A1A2E, #2D2D44)',
                  sort_order: carousel.slides.length,
                  created_at: new Date().toISOString(),
                };
                addSlide(newSlide);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[var(--border)] text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Slide
            </button>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-11 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedElement(null)}
                className={cn(
                  'p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all',
                )}
                title="Selecionar"
              >
                <Square className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <button
                onClick={() => setSelectedElement('headline')}
                className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
                title="Editar Título"
              >
                <Type className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all" title="Imagem">
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(zoom - 0.1)}
                className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-[var(--foreground-muted)] w-12 text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(zoom + 0.1)}
                className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto canvas-container p-8">
            <div
              className="relative mx-auto shadow-2xl shadow-black/50 rounded-lg overflow-hidden"
              style={{
                width: dimensions.width * zoom,
                height: dimensions.height * zoom,
              }}
            >
              {/* Slide Canvas */}
              <div
                className="w-full h-full relative"
                style={{
                  background: activeSlide?.background_value?.startsWith('linear')
                    ? activeSlide.background_value
                    : activeSlide?.background_value || '#1A1A2E',
                }}
              >
                {/* Slide Content - rendered as editable overlays */}
                <div
                  className="absolute inset-0 p-[8%] overflow-hidden flex flex-col justify-between"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: `${100/zoom}%`,
                    height: `${100/zoom}%`,
                    fontFamily: primaryFont,
                    color: textColor
                  }}
                >
                  {(() => {
                    const layout = (activeSlide?.canvas_data?.layout as string) || 'clean';

                    // 1. COVER LAYOUT
                    if (layout === 'cover') {
                      return (
                        <div className="h-full flex flex-col justify-between py-6">
                          {/* Top Tag */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-widest border border-white/20 px-3 py-1.5 rounded-full bg-white/5 font-semibold">
                              {carousel.niche || 'Instagram'}
                            </span>
                            <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest font-mono">
                              {carousel.format}
                            </span>
                          </div>

                          {/* Headline */}
                          <div className="flex-1 flex flex-col justify-center my-6">
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all p-2',
                                editingField === 'headline' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('headline')}
                            >
                              {editingField === 'headline' ? (
                                <textarea
                                  value={activeSlide?.headline || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-bold leading-tight"
                                  style={{ color: textColor, fontSize: '56px' }}
                                  rows={3}
                                />
                              ) : (
                                <h2 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                                  {activeSlide?.headline || 'Título de Impacto'}
                                </h2>
                              )}
                            </div>

                            {/* Subtitle */}
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all mt-4 p-1',
                                editingField === 'subtitle' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('subtitle')}
                            >
                              {editingField === 'subtitle' ? (
                                <textarea
                                  value={activeSlide?.subtitle || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-normal"
                                  style={{ color: subtitleColor, fontSize: '24px' }}
                                  rows={2}
                                />
                              ) : (
                                <p className="text-xl md:text-2xl font-normal leading-snug" style={{ color: subtitleColor }}>
                                  {activeSlide?.subtitle || 'Subtítulo complementar aqui'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Footer Brand Indicator */}
                          <div className="flex items-center gap-2 border-t border-white/10 pt-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            <span className="text-xs uppercase tracking-widest text-[var(--foreground-muted)] font-mono">
                              Arrastar para o lado ➔
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // 2. BIG NUMBER LAYOUT
                    if (layout === 'big_number') {
                      return (
                        <div className="h-full flex flex-col justify-between relative py-4">
                          {/* Giant Translucent Number */}
                          <div
                            className="absolute right-0 top-0 text-[200px] font-black opacity-10 pointer-events-none select-none font-mono"
                            style={{ WebkitTextStroke: '2px currentColor', color: textColor }}
                          >
                            {String(activeSlide?.slide_number).padStart(2, '0')}
                          </div>

                          {/* Header badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider bg-[var(--primary)]/25 text-[var(--primary-light)] px-2 py-0.5 rounded-md font-semibold">
                              Passo {activeSlide?.slide_number}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-end mb-6 z-10">
                            {/* Headline */}
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all p-2',
                                editingField === 'headline' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('headline')}
                            >
                              {editingField === 'headline' ? (
                                <textarea
                                  value={activeSlide?.headline || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-bold leading-tight"
                                  style={{ color: textColor, fontSize: '42px' }}
                                  rows={3}
                                />
                              ) : (
                                <h2 className="text-4xl font-bold leading-tight tracking-tight">
                                  {activeSlide?.headline || 'Título do Passo'}
                                </h2>
                              )}
                            </div>

                            {/* Subtitle */}
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all mt-2 p-1',
                                editingField === 'subtitle' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('subtitle')}
                            >
                              {editingField === 'subtitle' ? (
                                <textarea
                                  value={activeSlide?.subtitle || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-normal"
                                  style={{ color: subtitleColor, fontSize: '20px' }}
                                  rows={2}
                                />
                              ) : (
                                <p className="text-lg leading-snug font-normal mt-1" style={{ color: subtitleColor }}>
                                  {activeSlide?.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Body */}
                            {(activeSlide?.body || editingField === 'body') && (
                              <div
                                className={cn(
                                  'cursor-text rounded-lg transition-all mt-3 p-1',
                                  editingField === 'body' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                                )}
                                onClick={() => setEditingField('body')}
                              >
                                {editingField === 'body' ? (
                                  <textarea
                                    value={activeSlide?.body || ''}
                                    onChange={(e) => updateSlide(activeSlideIndex, { body: e.target.value })}
                                    onBlur={() => setEditingField(null)}
                                    autoFocus
                                    className="w-full bg-transparent border-none outline-none resize-none"
                                    style={{ color: subtitleColor, fontSize: '16px' }}
                                    rows={3}
                                  />
                                ) : (
                                  <p className="text-sm leading-relaxed" style={{ color: subtitleColor }}>
                                    {activeSlide?.body}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // 3. SPLIT SCREEN LAYOUT
                    if (layout === 'split') {
                      return (
                        <div className="h-full grid grid-rows-2 gap-4 py-4">
                          {/* Top Split Panel (Visual Card Block) */}
                          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-[var(--foreground-muted)]">
                              Destaque Visual
                            </span>
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all p-1',
                                editingField === 'subtitle' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('subtitle')}
                            >
                              {editingField === 'subtitle' ? (
                                <textarea
                                  value={activeSlide?.subtitle || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-normal"
                                  style={{ color: textColor, fontSize: '20px' }}
                                  rows={2}
                                />
                              ) : (
                                <p className="text-base font-semibold leading-snug italic" style={{ color: textColor }}>
                                  {activeSlide?.subtitle || 'Subtítulo em destaque na split screen'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom Split (Copy block) */}
                          <div className="flex flex-col justify-center px-2">
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all p-1',
                                editingField === 'headline' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('headline')}
                            >
                              {editingField === 'headline' ? (
                                <textarea
                                  value={activeSlide?.headline || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-bold leading-tight"
                                  style={{ color: textColor, fontSize: '36px' }}
                                  rows={2}
                                />
                              ) : (
                                <h3 className="text-3xl font-bold leading-tight tracking-tight">
                                  {activeSlide?.headline}
                                </h3>
                              )}
                            </div>

                            {activeSlide?.body && (
                              <p className="text-sm mt-2 leading-relaxed" style={{ color: subtitleColor }}>
                                {activeSlide.body}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // 4. QUOTE LAYOUT
                    if (layout === 'quote') {
                      return (
                        <div className="h-full flex flex-col justify-between py-6">
                          {/* Quote Icon */}
                          <div className="text-7xl font-serif text-[var(--primary-light)] opacity-40 select-none leading-none">
                            “
                          </div>

                          {/* Quote Body */}
                          <div className="flex-1 flex items-center px-4">
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all w-full p-2',
                                editingField === 'headline' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('headline')}
                            >
                              {editingField === 'headline' ? (
                                <textarea
                                  value={activeSlide?.headline || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-bold text-center leading-relaxed"
                                  style={{ color: textColor, fontSize: '32px' }}
                                  rows={3}
                                />
                              ) : (
                                <h3 className="text-2xl md:text-3xl font-medium text-center leading-relaxed italic">
                                  {activeSlide?.headline || 'Insira uma frase ou citação marcante aqui.'}
                                </h3>
                              )}
                            </div>
                          </div>

                          {/* Signature Footer */}
                          <div className="flex flex-col items-center border-t border-white/10 pt-4 gap-1">
                            <span className="text-sm font-bold">{brandKit?.name || 'Postify Studio'}</span>
                            <span className="text-xs text-[var(--foreground-muted)] font-mono">@{brandKit?.name ? brandKit.name.toLowerCase().replace(/\s/g, '') : 'postify'}</span>
                          </div>
                        </div>
                      );
                    }

                    // 5. CTA LAYOUT (CTA Final)
                    if (layout === 'cta') {
                      return (
                        <div className="h-full flex flex-col justify-between py-8">
                          {/* Badge header */}
                          <div className="flex justify-center">
                            <span className="text-[10px] uppercase tracking-widest text-[var(--foreground-muted)]">
                              PRONTO PARA APLICAR?
                            </span>
                          </div>

                          {/* Centered CTA */}
                          <div className="flex-1 flex flex-col justify-center items-center text-center px-6">
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all p-2 w-full',
                                editingField === 'headline' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('headline')}
                            >
                              {editingField === 'headline' ? (
                                <textarea
                                  value={activeSlide?.headline || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-bold text-center leading-tight"
                                  style={{ color: textColor, fontSize: '38px' }}
                                  rows={2}
                                />
                              ) : (
                                <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                                  {activeSlide?.headline || 'Gostou do conteúdo?'}
                                </h2>
                              )}
                            </div>

                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all mt-3 p-1 w-full',
                                editingField === 'subtitle' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('subtitle')}
                            >
                              {editingField === 'subtitle' ? (
                                <textarea
                                  value={activeSlide?.subtitle || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none font-normal text-center"
                                  style={{ color: subtitleColor, fontSize: '18px' }}
                                  rows={2}
                                />
                              ) : (
                                <p className="text-base font-normal" style={{ color: subtitleColor }}>
                                  {activeSlide?.subtitle || 'Comente e compartilhe!'}
                                </p>
                              )}
                            </div>

                            {/* CTA Action Box */}
                            {activeSlide?.cta && (
                              <div className="mt-8 w-full flex justify-center">
                                <div
                                  className="px-8 py-3.5 rounded-full cursor-text bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg font-bold flex items-center justify-center gap-2"
                                  onClick={() => setEditingField('cta')}
                                >
                                  {editingField === 'cta' ? (
                                    <input
                                      value={activeSlide.cta}
                                      onChange={(e) => updateSlide(activeSlideIndex, { cta: e.target.value })}
                                      onBlur={() => setEditingField(null)}
                                      autoFocus
                                      className="bg-transparent border-none outline-none text-center font-bold text-white"
                                      style={{ fontSize: '18px' }}
                                    />
                                  ) : (
                                    <span className="text-base font-bold text-white">
                                      {activeSlide.cta}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer Username */}
                          <div className="flex justify-center border-t border-white/10 pt-4">
                            <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-widest font-mono">
                              @{brandKit?.name ? brandKit.name.toLowerCase().replace(/\s/g, '') : 'seuprofile'}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // 6. CLEAN / MINIMALIST LAYOUT (Default)
                    return (
                      <div className="h-full flex flex-col justify-between py-6">
                        {/* Slide number */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-[var(--primary-light)]">
                            0{activeSlide?.slide_number}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        </div>

                        {/* Text center spacer */}
                        <div className="flex-1 flex flex-col justify-center my-6">
                          {/* Headline */}
                          <div
                            className={cn(
                              'cursor-text rounded-lg transition-all p-2',
                              editingField === 'headline' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                            )}
                            onClick={() => setEditingField('headline')}
                          >
                            {editingField === 'headline' ? (
                              <textarea
                                value={activeSlide?.headline || ''}
                                onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none resize-none font-bold leading-tight"
                                style={{ color: textColor, fontSize: '48px' }}
                                rows={3}
                              />
                            ) : (
                              <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                                {activeSlide?.headline || 'Título Principal'}
                              </h2>
                            )}
                          </div>

                          {/* Subtitle */}
                          <div
                            className={cn(
                              'cursor-text rounded-lg transition-all mt-4 p-1',
                              editingField === 'subtitle' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                            )}
                            onClick={() => setEditingField('subtitle')}
                          >
                            {editingField === 'subtitle' ? (
                              <textarea
                                value={activeSlide?.subtitle || ''}
                                onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
                                  onBlur={() => setEditingField(null)}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none resize-none font-normal"
                                style={{ color: subtitleColor, fontSize: '22px' }}
                                rows={2}
                              />
                            ) : (
                              <p className="text-lg md:text-xl font-normal leading-snug mt-1" style={{ color: subtitleColor }}>
                                {activeSlide?.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Body */}
                          {(activeSlide?.body || editingField === 'body') && (
                            <div
                              className={cn(
                                'cursor-text rounded-lg transition-all mt-4 p-1',
                                editingField === 'body' ? 'ring-2 ring-[var(--primary)] bg-white/5' : 'hover:ring-1 hover:ring-white/20'
                              )}
                              onClick={() => setEditingField('body')}
                            >
                              {editingField === 'body' ? (
                                <textarea
                                  value={activeSlide?.body || ''}
                                  onChange={(e) => updateSlide(activeSlideIndex, { body: e.target.value })}
                                    onBlur={() => setEditingField(null)}
                                  autoFocus
                                  className="w-full bg-transparent border-none outline-none resize-none"
                                  style={{ color: subtitleColor, fontSize: '18px' }}
                                  rows={3}
                                />
                              ) : (
                                <p className="text-base mt-2 leading-relaxed" style={{ color: subtitleColor }}>
                                  {activeSlide?.body}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer Spacer */}
                        <div className="h-4" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-[280px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--background-secondary)] overflow-y-auto">
          <div className="p-4 border-b border-[var(--border)]">
            <span className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
              Propriedades
            </span>
          </div>

          {/* Slide Info */}
          <div className="property-group">
            <label className="property-label block">Slide {activeSlideIndex + 1}</label>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={activeSlide?.role || 'content'}
                onChange={(e) => updateSlide(activeSlideIndex, { role: e.target.value as Slide['role'] })}
                className="input-dark flex-1 px-3 py-1.5 text-xs"
              >
                <option value="hook">Hook</option>
                <option value="content">Conteúdo</option>
                <option value="authority">Autoridade</option>
                <option value="proof">Prova</option>
                <option value="cta">CTA</option>
                <option value="transition">Transição</option>
              </select>
            </div>
          </div>

          {/* Slide Layout */}
          <div className="property-group">
            <label className="property-label block">Layout do Slide</label>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={(activeSlide?.canvas_data?.layout as string) || 'clean'}
                onChange={(e) => {
                  const layout = e.target.value;
                  const canvas_data = { ...(activeSlide?.canvas_data || {}), layout };
                  updateSlide(activeSlideIndex, { canvas_data });
                }}
                className="input-dark flex-1 px-3 py-1.5 text-xs"
              >
                <option value="cover">Capa / Hook</option>
                <option value="big_number">Número Gigante</option>
                <option value="split">Split Screen</option>
                <option value="quote">Citação</option>
                <option value="clean">Clean / Minimalista</option>
                <option value="cta">CTA Final</option>
              </select>
            </div>
          </div>

          {/* Text Properties */}
          <div className="property-group">
            <label className="property-label block">Título</label>
            <textarea
              value={activeSlide?.headline || ''}
              onChange={(e) => updateSlide(activeSlideIndex, { headline: e.target.value })}
              className="input-dark w-full px-3 py-2 text-xs mt-1 resize-none"
              rows={2}
              placeholder="Título do slide"
            />
          </div>

          <div className="property-group">
            <label className="property-label block">Subtítulo</label>
            <textarea
              value={activeSlide?.subtitle || ''}
              onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
              className="input-dark w-full px-3 py-2 text-xs mt-1 resize-none"
              rows={2}
              placeholder="Subtítulo do slide"
            />
          </div>

          <div className="property-group">
            <label className="property-label block">Corpo</label>
            <textarea
              value={activeSlide?.body || ''}
              onChange={(e) => updateSlide(activeSlideIndex, { body: e.target.value })}
              className="input-dark w-full px-3 py-2 text-xs mt-1 resize-none"
              rows={2}
              placeholder="Texto adicional"
            />
          </div>

          <div className="property-group">
            <label className="property-label block">CTA</label>
            <input
              value={activeSlide?.cta || ''}
              onChange={(e) => updateSlide(activeSlideIndex, { cta: e.target.value || null })}
              className="input-dark w-full px-3 py-2 text-xs mt-1"
              placeholder="Chamada para ação"
            />
          </div>

          {/* Background */}
          <div className="property-group">
            <label className="property-label block">Fundo</label>
            <div className="space-y-2 mt-2">
              <select
                value={activeSlide?.background_type || 'gradient'}
                onChange={(e) => {
                  const type = e.target.value as 'solid' | 'gradient' | 'image';
                  let value = activeSlide?.background_value || '#1A1A2E';
                  if (type === 'solid') value = '#1A1A2E';
                  if (type === 'gradient') value = 'linear-gradient(135deg, #1A1A2E, #2D2D44)';
                  updateSlide(activeSlideIndex, { background_type: type, background_value: value });
                }}
                className="input-dark w-full px-3 py-1.5 text-xs"
              >
                <option value="solid">Cor Sólida</option>
                <option value="gradient">Gradiente</option>
                <option value="image">Imagem</option>
              </select>

              {activeSlide?.background_type === 'solid' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeSlide.background_value || '#1A1A2E'}
                    onChange={(e) => updateSlide(activeSlideIndex, { background_value: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={activeSlide.background_value || '#1A1A2E'}
                    onChange={(e) => updateSlide(activeSlideIndex, { background_value: e.target.value })}
                    className="input-dark flex-1 px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              )}

              {activeSlide?.background_type === 'gradient' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {(() => {
                      const colors = activeSlide.background_value.match(/#[0-9A-Fa-f]{6}/g) || ['#1A1A2E', '#2D2D44'];
                      return colors.map((color, i) => (
                        <div key={i} className="flex items-center gap-1 flex-1">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...colors];
                              newColors[i] = e.target.value;
                              updateSlide(activeSlideIndex, {
                                background_value: `linear-gradient(135deg, ${newColors.join(', ')})`,
                              });
                            }}
                            className="w-7 h-7 rounded border border-[var(--border)] cursor-pointer"
                          />
                          <span className="text-[10px] text-[var(--foreground-muted)] font-mono">{color}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Quick color presets */}
              <div>
                <label className="text-[10px] text-[var(--foreground-muted)] block mb-1.5">Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {VISUAL_STYLES.map((vs) => (
                    <button
                      key={vs.value}
                      onClick={() => {
                        updateSlide(activeSlideIndex, {
                          background_type: 'gradient',
                          background_value: `linear-gradient(135deg, ${vs.colors[0]}, ${vs.colors[1]})`,
                        });
                      }}
                      className="color-swatch"
                      style={{
                        background: `linear-gradient(135deg, ${vs.colors[0]}, ${vs.colors[1]})`,
                      }}
                      title={vs.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Caption & Hashtags */}
          <div className="property-group">
            <label className="property-label block">Legenda Instagram</label>
            <textarea
              value={carousel.caption || ''}
              onChange={(e) => {
                const updated = { ...carousel, caption: e.target.value };
                setCarousel(updated);
              }}
              className="input-dark w-full px-3 py-2 text-xs mt-1 resize-none"
              rows={4}
              placeholder="Legenda para Instagram"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
