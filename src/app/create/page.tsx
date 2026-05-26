'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  BookOpen,
  Crown,
  DollarSign,
  Flame,
  Target,
  Zap,
  MessageSquare,
  Star,
  GraduationCap,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CarouselGenerationParams,
  CarouselObjective,
  CarouselTone,
  VisualStyle,
  CarouselFormat,
} from '@/types/carousel';
import { OBJECTIVES, TONES, VISUAL_STYLES, NICHES } from '@/lib/constants';
import { generateCarousel } from '@/services/ai-service';
import { saveCarousel, fetchProjectById } from '@/services/db-service';
import { useAppStore } from '@/stores/app-store';
import { Project } from '@/types/brand-kit';

const objectiveIcons: Record<string, React.ElementType> = {
  educar: BookOpen,
  autoridade: Crown,
  venda: DollarSign,
  engajamento: Flame,
  quebra_objecao: Target,
};

const toneIcons: Record<string, React.ElementType> = {
  direto: Zap,
  provocador: Flame,
  premium: Star,
  didatico: GraduationCap,
  humanizado: Heart,
};

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  const { aiProvider, openaiApiKey, geminiApiKey } = useAppStore();
  const apiKey = aiProvider === 'openai' ? openaiApiKey : geminiApiKey;
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [params, setParams] = useState<CarouselGenerationParams>({
    theme: '',
    niche: '',
    audience: '',
    objective: 'educar',
    tone: 'direto',
    visual_style: 'high_ticket_dark',
    format: '1080x1350',
    slide_count: 7,
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId).then((proj) => {
        if (proj) {
          setProject(proj);
          setParams((prev) => ({
            ...prev,
            audience: proj.target_audience || prev.audience,
            tone: (proj.brand_tone as CarouselTone) || prev.tone,
          }));
        }
      });
    }
  }, [projectId]);

  const updateParam = <K extends keyof CarouselGenerationParams>(
    key: K,
    value: CarouselGenerationParams[K]
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 = params.theme && params.niche && params.audience;
  const canProceedStep2 = params.visual_style && params.format;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCarousel(params, aiProvider, apiKey, project || undefined);

      const carouselId = crypto.randomUUID();
      const carousel = {
        id: carouselId,
        user_id: '00000000-0000-0000-0000-000000000000',
        collection_id: null,
        brand_kit_id: null,
        project_id: project?.id || null,
        title: result.title,
        theme: result.theme,
        niche: params.niche,
        audience: params.audience,
        objective: params.objective,
        tone: params.tone,
        visual_style: params.visual_style,
        format: params.format,
        status: 'draft' as const,
        caption: result.caption,
        hashtags: result.hashtags,
        metadata: {},
        slides: result.slides.map((s, i) => {
          let layout = 'clean';
          if (s.canvas_data && s.canvas_data.layout) {
            layout = s.canvas_data.layout;
          } else {
            if (i === 0) {
              layout = 'cover';
            } else if (i === result.slides.length - 1) {
              layout = 'cta';
            } else {
              const layouts = ['big_number', 'split', 'quote', 'clean'];
              layout = layouts[(i - 1) % layouts.length];
            }
          }

          return {
            id: crypto.randomUUID(),
            carousel_id: carouselId,
            slide_number: s.slideNumber,
            role: s.role,
            headline: s.headline,
            subtitle: s.subtitle,
            body: s.body,
            visual_direction: s.visualDirection,
            image_prompt: s.imagePrompt,
            cta: s.cta,
            canvas_data: { layout },
            background_type: 'gradient' as const,
            background_value: getDefaultBackground(params.visual_style, i),
            sort_order: i,
            created_at: new Date().toISOString(),
          };
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to Supabase
      const success = await saveCarousel(carousel);
      if (!success) {
        throw new Error('Falha ao salvar o carrossel no banco de dados.');
      }

      // Store in localStorage as backup
      localStorage.setItem(`carousel_${carouselId}`, JSON.stringify(carousel));
      router.push(`/editor/${carouselId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar carrossel');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-jakarta)] tracking-tight">
            Criar Carrossel
          </h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            Configure o tema, estilo e tom — a IA faz o resto
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <button
                onClick={() => s < step && setStep(s)}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300',
                  s === step
                    ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[var(--primary-glow)]'
                    : s < step
                      ? 'bg-[var(--success)]/20 text-[var(--success)]'
                      : 'bg-[var(--surface)] text-[var(--foreground-muted)] border border-[var(--border)]'
                )}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </button>
              {s < 3 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 rounded-full transition-colors duration-300',
                    s < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Content */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--primary-light)]" />
                Conteúdo
              </h2>

              {/* Theme */}
              <div>
                <label className="property-label block">Tema do Carrossel *</label>
                <input
                  type="text"
                  placeholder="Ex: 5 erros que destroem seu marketing digital"
                  value={params.theme}
                  onChange={(e) => updateParam('theme', e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
                  Descreva o tema principal que será abordado no carrossel
                </p>
              </div>

              {/* Niche */}
              <div>
                <label className="property-label block">Nicho *</label>
                <select
                  value={params.niche}
                  onChange={(e) => updateParam('niche', e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Selecione o nicho</option>
                  {NICHES.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="property-label block">Público-alvo *</label>
                <input
                  type="text"
                  placeholder="Ex: Empreendedores que faturam 10-50k/mês"
                  value={params.audience}
                  onChange={(e) => updateParam('audience', e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                />
              </div>
            </div>

            {/* Objective */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--primary-light)]" />
                Objetivo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {OBJECTIVES.map((obj) => {
                  const Icon = objectiveIcons[obj.value] || Target;
                  return (
                    <button
                      key={obj.value}
                      onClick={() => updateParam('objective', obj.value)}
                      className={cn(
                        'flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left',
                        params.objective === obj.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-[var(--primary-glow)]'
                          : 'border-[var(--border)] bg-[var(--surface-glass)] hover:border-[var(--border-hover)]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 mb-2',
                          params.objective === obj.value
                            ? 'text-[var(--primary-light)]'
                            : 'text-[var(--foreground-muted)]'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          params.objective === obj.value
                            ? 'text-[var(--foreground)]'
                            : 'text-[var(--foreground-secondary)]'
                        )}
                      >
                        {obj.label}
                      </span>
                      <span className="text-[10px] text-[var(--foreground-muted)] mt-0.5">
                        {obj.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--primary-light)]" />
                Tom de Voz
              </h2>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => {
                  const Icon = toneIcons[tone.value] || Zap;
                  return (
                    <button
                      key={tone.value}
                      onClick={() => updateParam('tone', tone.value)}
                      className={cn(
                        'pill-selector',
                        params.tone === tone.value && 'active'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tone.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={cn(
                  'btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold',
                  !canProceedStep1 && 'opacity-40 cursor-not-allowed'
                )}
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Visual */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            {/* Slide Count */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Quantidade de Slides
              </h2>
              <div className="flex items-center gap-6">
                <input
                  type="range"
                  min={5}
                  max={10}
                  value={params.slide_count}
                  onChange={(e) => updateParam('slide_count', Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)]"
                />
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{params.slide_count}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-2">
                <span>5 slides</span>
                <span>10 slides</span>
              </div>
            </div>

            {/* Format */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Formato
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '1080x1350' as CarouselFormat, label: '1080 × 1350', aspect: '4:5', desc: 'Formato vertical (recomendado)' },
                  { value: '1080x1080' as CarouselFormat, label: '1080 × 1080', aspect: '1:1', desc: 'Formato quadrado' },
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => updateParam('format', format.value)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
                      params.format === format.value
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-[var(--primary-glow)]'
                        : 'border-[var(--border)] bg-[var(--surface-glass)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-lg border-2',
                        params.format === format.value
                          ? 'border-[var(--primary-light)]'
                          : 'border-[var(--foreground-muted)]',
                        format.value === '1080x1350' ? 'w-8 h-10' : 'w-9 h-9'
                      )}
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{format.label}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{format.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Estilo Visual
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VISUAL_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => updateParam('visual_style', style.value)}
                    className={cn(
                      'flex flex-col rounded-xl border overflow-hidden transition-all duration-200',
                      params.visual_style === style.value
                        ? 'border-[var(--primary)] shadow-lg shadow-[var(--primary-glow)]'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    {/* Color preview */}
                    <div
                      className="h-20 w-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]})`,
                      }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: style.colors[3] || style.colors[2] }}
                      >
                        Aa Bb Cc
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--surface-glass)]">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{style.label}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">{style.description}</p>
                      {/* Color swatches */}
                      <div className="flex gap-1.5 mt-2">
                        {style.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-md border border-white/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className={cn(
                  'btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold',
                  !canProceedStep2 && 'opacity-40 cursor-not-allowed'
                )}
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Generate */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--primary-light)]" />
                Revisão
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Tema', value: params.theme },
                  { label: 'Nicho', value: params.niche },
                  { label: 'Público-alvo', value: params.audience },
                  { label: 'Objetivo', value: OBJECTIVES.find(o => o.value === params.objective)?.label },
                  { label: 'Tom de Voz', value: TONES.find(t => t.value === params.tone)?.label },
                  { label: 'Estilo Visual', value: VISUAL_STYLES.find(s => s.value === params.visual_style)?.label },
                  { label: 'Formato', value: params.format },
                  { label: 'Slides', value: `${params.slide_count} slides` },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-[var(--surface-glass)] border border-[var(--border)]">
                    <p className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)] mt-1 truncate">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Preview */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Preview do Estilo</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {Array.from({ length: Math.min(params.slide_count, 5) }).map((_, i) => {
                  const style = VISUAL_STYLES.find(s => s.value === params.visual_style);
                  const colors = style?.colors || ['#1A1A2E', '#2D2D44'];
                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 w-24 rounded-lg overflow-hidden border border-[var(--border)]"
                      style={{ aspectRatio: params.format === '1080x1350' ? '4/5' : '1/1' }}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center p-2"
                        style={{
                          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                        }}
                      >
                        <span
                          className="text-[8px] font-bold text-center leading-tight"
                          style={{ color: colors[3] || colors[2] }}
                        >
                          {i === 0 ? 'HOOK' : i === params.slide_count - 1 ? 'CTA' : `SLIDE ${i + 1}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {params.slide_count > 5 && (
                  <div className="flex-shrink-0 w-24 rounded-lg border border-[var(--border)] flex items-center justify-center bg-[var(--surface-glass)]"
                    style={{ aspectRatio: params.format === '1080x1350' ? '4/5' : '1/1' }}
                  >
                    <span className="text-xs text-[var(--foreground-muted)]">+{params.slide_count - 5}</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20">
                <p className="text-sm text-[var(--danger)]">{error}</p>
              </div>
            )}

            {/* Nav Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={cn(
                  'btn-gradient flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold',
                  isGenerating && 'opacity-80 cursor-wait'
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Gerar Carrossel
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultBackground(style: VisualStyle, slideIndex: number): string {
  const backgrounds: Record<VisualStyle, string[]> = {
    high_ticket_dark: [
      'linear-gradient(135deg, #0A0A2E 0%, #1A1040 100%)',
      'linear-gradient(135deg, #1A1040 0%, #0A0A2E 100%)',
      'linear-gradient(180deg, #0F0F23 0%, #1A1040 100%)',
    ],
    minimalista_medico: [
      'linear-gradient(135deg, #FFFFFF 0%, #E8F4FD 100%)',
      'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)',
      'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)',
    ],
    twitter_style: [
      '#FFFFFF',
      '#F7F9FA',
      '#FFFFFF',
    ],
    varejo_promocional: [
      'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
      'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
    ],
    institucional_premium: [
      'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
      'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)',
      'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
    ],
  };

  const bgs = backgrounds[style] || backgrounds.high_ticket_dark;
  return bgs[slideIndex % bgs.length];
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
