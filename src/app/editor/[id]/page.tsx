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
import { fetchCarouselById, saveCarousel } from '@/services/db-service';

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

  // Load carousel from Supabase (with localStorage fallback)
  useEffect(() => {
    async function loadCarousel() {
      const dbCarousel = await fetchCarouselById(carouselId);
      if (dbCarousel) {
        setCarousel(dbCarousel);
      } else {
        const stored = localStorage.getItem(`carousel_${carouselId}`);
        if (stored) {
          setCarousel(JSON.parse(stored));
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

        // Draw slide number badge
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        if (slide.role !== 'hook' && slide.role !== 'cta') {
          ctx.beginPath();
          ctx.roundRect(80, 100, 60, 36, 12);
          ctx.fill();
          ctx.fillStyle = textColor;
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${String(slide.slide_number).padStart(2, '0')}`, 110, 124);
        }

        // Draw headline
        ctx.fillStyle = textColor;
        ctx.font = 'bold 56px Inter, sans-serif';
        ctx.textAlign = 'left';
        const headlineLines = wrapText(ctx, slide.headline, canvas.width - 160);
        const startY = slide.role === 'hook' || slide.role === 'cta'
          ? canvas.height / 2 - (headlineLines.length * 66) / 2
          : 200;
        headlineLines.forEach((line, li) => {
          ctx.fillText(line, 80, startY + li * 66);
        });

        // Draw subtitle
        if (slide.subtitle) {
          ctx.fillStyle = subtitleColor;
          ctx.font = '400 28px Inter, sans-serif';
          const subtitleY = startY + headlineLines.length * 66 + 30;
          const subtitleLines = wrapText(ctx, slide.subtitle, canvas.width - 160);
          subtitleLines.forEach((line, li) => {
            ctx.fillText(line, 80, subtitleY + li * 38);
          });
        }

        // Draw body
        if (slide.body) {
          ctx.fillStyle = subtitleColor;
          ctx.font = '400 24px Inter, sans-serif';
          const bodyY = startY + headlineLines.length * 66 + (slide.subtitle ? 100 : 40);
          const bodyLines = wrapText(ctx, slide.body, canvas.width - 160);
          bodyLines.forEach((line, li) => {
            ctx.fillText(line, 80, bodyY + li * 34);
          });
        }

        // Draw CTA
        if (slide.cta) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          const ctaWidth = ctx.measureText(slide.cta).width + 60;
          ctx.beginPath();
          ctx.roundRect(
            (canvas.width - ctaWidth) / 2,
            canvas.height - 200,
            ctaWidth,
            56,
            28
          );
          ctx.fill();
          ctx.fillStyle = textColor;
          ctx.font = 'bold 22px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(slide.cta, canvas.width / 2, canvas.height - 168);
          ctx.textAlign = 'left';
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
                  className="absolute inset-0 flex flex-col p-[8%] overflow-hidden"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100/zoom}%`, height: `${100/zoom}%` }}
                >
                  {/* Slide Number Badge */}
                  {activeSlide?.role !== 'hook' && activeSlide?.role !== 'cta' && (
                    <div
                      className="inline-flex self-start items-center px-3 py-1.5 rounded-lg mb-6"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <span className="text-sm font-bold" style={{ color: textColor }}>
                        {String(activeSlide?.slide_number).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {/* Spacer for centered content on hook/cta */}
                  {(activeSlide?.role === 'hook' || activeSlide?.role === 'cta') && <div className="flex-1" />}

                  {/* Headline */}
                  <div
                    className={cn(
                      'cursor-text rounded-lg transition-all',
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
                        style={{
                          color: textColor,
                          fontSize: `${Math.max(28, 52 * zoom)}px`,
                        }}
                        rows={3}
                      />
                    ) : (
                      <h2
                        className="font-bold leading-tight"
                        style={{
                          color: textColor,
                          fontSize: '52px',
                        }}
                      >
                        {activeSlide?.headline || 'Título aqui'}
                      </h2>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div
                    className={cn(
                      'cursor-text rounded-lg transition-all mt-4',
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
                        style={{
                          color: subtitleColor,
                          fontSize: '24px',
                        }}
                        rows={2}
                      />
                    ) : (
                      <p
                        className="font-normal"
                        style={{
                          color: subtitleColor,
                          fontSize: '24px',
                        }}
                      >
                        {activeSlide?.subtitle || 'Subtítulo aqui'}
                      </p>
                    )}
                  </div>

                  {/* Body */}
                  {(activeSlide?.body || editingField === 'body') && (
                    <div
                      className={cn(
                        'cursor-text rounded-lg transition-all mt-4',
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
                          style={{
                            color: subtitleColor,
                            fontSize: '20px',
                          }}
                          rows={2}
                        />
                      ) : (
                        <p style={{ color: subtitleColor, fontSize: '20px' }}>
                          {activeSlide?.body}
                        </p>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  {activeSlide?.cta && (
                    <div className="mt-8 flex justify-center">
                      <div
                        className="px-8 py-3 rounded-full cursor-text"
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                        onClick={() => setEditingField('cta')}
                      >
                        {editingField === 'cta' ? (
                          <input
                            value={activeSlide.cta}
                            onChange={(e) => updateSlide(activeSlideIndex, { cta: e.target.value })}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            className="bg-transparent border-none outline-none text-center font-bold"
                            style={{ color: textColor, fontSize: '20px' }}
                          />
                        ) : (
                          <span className="font-bold" style={{ color: textColor, fontSize: '20px' }}>
                            {activeSlide.cta}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(activeSlide?.role === 'hook' || activeSlide?.role === 'cta') && <div className="flex-1" />}
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
