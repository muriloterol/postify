'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Search,
  LayoutGrid,
  SlidersHorizontal,
  FileImage,
  Clock,
  TrendingUp,
  FolderOpen,
  MoreVertical,
  Pencil,
  Copy,
  Download,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { Carousel, CarouselStatus } from '@/types/carousel';
import { fetchCarousels, deleteCarousel, saveCarousel } from '@/services/db-service';

const statusLabels: Record<CarouselStatus, string> = {
  draft: 'Rascunho',
  completed: 'Concluído',
  exported: 'Exportado',
};

const styleColors: Record<string, string[]> = {
  high_ticket_dark: ['#0A0A2E', '#1A1040', '#D4AF37'],
  minimalista_medico: ['#E8F4FD', '#3B82F6', '#FFFFFF'],
  twitter_style: ['#F7F9FA', '#0F1419', '#FFFFFF'],
  varejo_promocional: ['#DC2626', '#FBBF24', '#FFFFFF'],
  institucional_premium: ['#0F172A', '#1E3A5F', '#60A5FA'],
};

export default function DashboardPage() {
  const router = useRouter();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CarouselStatus | 'all'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const loadCarousels = async () => {
    setIsLoading(true);
    const data = await fetchCarousels();
    setCarousels(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCarousels();
  }, []);

  const handleDuplicate = async (carousel: Carousel) => {
    const newCarouselId = crypto.randomUUID();
    const duplicatedCarousel: Carousel = {
      ...carousel,
      id: newCarouselId,
      title: `${carousel.title} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slides: carousel.slides.map((slide) => ({
        ...slide,
        id: crypto.randomUUID(),
        carousel_id: newCarouselId,
        created_at: new Date().toISOString(),
      })),
    };
    const success = await saveCarousel(duplicatedCarousel);
    if (success) {
      loadCarousels();
    }
    setOpenMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este carrossel?')) {
      const success = await deleteCarousel(id);
      if (success) {
        setCarousels((prev) => prev.filter((c) => c.id !== id));
      }
    }
    setOpenMenu(null);
  };

  const filteredCarousels = useMemo(() => {
    return carousels.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.niche.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [carousels, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: carousels.length,
      thisWeek: carousels.filter(
        (c) => Date.now() - new Date(c.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
      ).length,
      completed: carousels.filter((c) => c.status === 'completed').length,
      exported: carousels.filter((c) => c.status === 'exported').length,
    };
  }, [carousels]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-jakarta)] tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            Gerencie e crie seus carrosséis com IA no Postify
          </p>
        </div>
        <Link
          href="/create"
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          Criar Carrossel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          { label: 'Total de Carrosséis', value: stats.total, icon: FileImage, color: 'var(--primary)' },
          { label: 'Esta Semana', value: stats.thisWeek, icon: TrendingUp, color: 'var(--success)' },
          { label: 'Concluídos', value: stats.completed, icon: Clock, color: 'var(--info)' },
          { label: 'Exportados', value: stats.exported, icon: Download, color: 'var(--accent)' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Buscar carrosséis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'draft', 'completed', 'exported'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'pill-selector text-xs',
                statusFilter === status && 'active'
              )}
            >
              {status === 'all' ? 'Todos' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : filteredCarousels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filteredCarousels.map((carousel) => {
            const colors = styleColors[carousel.visual_style] || ['#1A1A2E', '#2D2D44', '#F5F5F5'];
            return (
              <div
                key={carousel.id}
                className="glass-card group overflow-hidden"
              >
                {/* Preview */}
                <Link href={`/editor/${carousel.id}`}>
                  <div
                    className="h-44 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                    }}
                  >
                    {/* Simulated slide preview */}
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      <p
                        className="text-lg font-bold leading-tight line-clamp-3"
                        style={{ color: colors[2] || '#F5F5F5' }}
                      >
                        {carousel.slides[0]?.headline || carousel.title}
                      </p>
                    </div>

                    {/* Slide count badge */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-medium text-white">
                        {carousel.slides.length} slides
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-90">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                          <span className="text-sm font-medium text-white flex items-center gap-2">
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {carousel.title}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        {carousel.niche} • {formatRelativeDate(carousel.created_at)}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === carousel.id ? null : carousel.id)}
                        className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-[var(--foreground-muted)]" />
                      </button>

                      {openMenu === carousel.id && (
                        <div className="absolute right-0 top-8 z-50 w-40 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
                          <Link
                            href={`/editor/${carousel.id}`}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--foreground-secondary)] hover:bg-white/5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDuplicate(carousel)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--foreground-secondary)] hover:bg-white/5 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleDelete(carousel.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={cn(
                        'slide-badge text-[10px]',
                        carousel.status === 'draft' && 'status-draft',
                        carousel.status === 'completed' && 'status-completed',
                        carousel.status === 'exported' && 'status-exported'
                      )}
                    >
                      {statusLabels[carousel.status]}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      {carousel.format}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-[var(--primary-light)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Nenhum carrossel encontrado
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] mb-6 max-w-sm text-center">
            Comece criando seu primeiro carrossel com IA. É rápido, fácil e profissional.
          </p>
          <Link
            href="/create"
            className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Criar Primeiro Carrossel
          </Link>
        </div>
      )}
    </div>
  );
}
