'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderOpen,
  Image as ImageIcon,
  FileImage,
  PlusCircle,
  Pencil,
  Copy,
  Trash2,
  MoreVertical,
  Loader2,
  Check,
  Save,
  Clock,
  Download,
  AlertCircle,
  FileText,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { Project, ProjectAsset } from '@/types/brand-kit';
import { Carousel, CarouselStatus } from '@/types/carousel';
import {
  fetchProjectById,
  saveProject,
  fetchCarouselsByProjectId,
  deleteCarousel,
  saveCarousel,
} from '@/services/db-service';
import { FileUploader } from '@/components/project/file-uploader';

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

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [activeTab, setActiveTab] = useState<'carousels' | 'briefing' | 'assets'>('carousels');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBriefing, setIsSavingBriefing] = useState(false);
  const [briefingSaved, setBriefingSaved] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Briefing Form State
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandTone, setBrandTone] = useState('direto');

  const loadProjectData = async () => {
    setIsLoading(true);
    const [proj, caros] = await Promise.all([
      fetchProjectById(id),
      fetchCarouselsByProjectId(id),
    ]);

    if (!proj) {
      router.push('/dashboard');
      return;
    }

    setProject(proj);
    setCarousels(caros);

    // Initialize briefing form
    setCompanyName(proj.company_name || '');
    setCompanyLogoUrl(proj.company_logo_url || '');
    setProductName(proj.product_name || '');
    setProductDetails(proj.product_details || '');
    setTargetAudience(proj.target_audience || '');
    setBrandTone(proj.brand_tone || 'direto');

    setIsLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const handleSaveBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setIsSavingBriefing(true);
    const updatedProject: Project = {
      ...project,
      company_name: companyName,
      company_logo_url: companyLogoUrl,
      product_name: productName,
      product_details: productDetails,
      target_audience: targetAudience,
      brand_tone: brandTone,
      updated_at: new Date().toISOString(),
    };

    const success = await saveProject(updatedProject);
    if (success) {
      setProject(updatedProject);
      setBriefingSaved(true);
      setTimeout(() => setBriefingSaved(false), 2000);
    } else {
      alert('Erro ao salvar briefing.');
    }
    setIsSavingBriefing(false);
  };

  const handleAssetUpload = async (type: 'product_photos' | 'reference_carousels', url: string, name: string, size: number) => {
    if (!project) return;

    const newAsset: ProjectAsset = { url, name, size, created_at: new Date().toISOString() };
    const updatedAssets = [...(project[type] || []), newAsset];

    const updatedProject: Project = {
      ...project,
      [type]: updatedAssets,
      updated_at: new Date().toISOString(),
    };

    const success = await saveProject(updatedProject);
    if (success) {
      setProject(updatedProject);
    }
  };

  const handleDeleteAsset = async (type: 'product_photos' | 'reference_carousels', index: number) => {
    if (!project) return;
    if (!confirm('Deseja remover este anexo?')) return;

    const updatedAssets = [...(project[type] || [])];
    updatedAssets.splice(index, 1);

    const updatedProject: Project = {
      ...project,
      [type]: updatedAssets,
      updated_at: new Date().toISOString(),
    };

    const success = await saveProject(updatedProject);
    if (success) {
      setProject(updatedProject);
    }
  };

  const handleDuplicateCarousel = async (carousel: Carousel) => {
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
      const updatedCaros = await fetchCarouselsByProjectId(id);
      setCarousels(updatedCaros);
    }
    setOpenMenu(null);
  };

  const handleDeleteCarousel = async (carouselId: string) => {
    if (confirm('Deseja realmente excluir este carrossel?')) {
      const success = await deleteCarousel(carouselId);
      if (success) {
        setCarousels((prev) => prev.filter((c) => c.id !== carouselId));
      }
    }
    setOpenMenu(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      {/* Back button & Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors border border-[var(--border)] text-[var(--foreground-muted)] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">
            Projeto / Pasta
          </span>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-jakarta)] leading-tight">
            {project.name}
          </h1>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[var(--border)] mb-8">
        {[
          { id: 'carousels', label: 'Carrosséis', icon: FolderOpen },
          { id: 'briefing', label: 'Briefing do Projeto', icon: FileText },
          { id: 'assets', label: 'Arquivos & Referências', icon: Paperclip },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer',
                isActive
                  ? 'border-[var(--primary)] text-white bg-white/[0.02]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.01]'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CAROUSELS */}
      {activeTab === 'carousels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Carrosséis Criados</h2>
            <Link
              href={`/create?project_id=${project.id}`}
              className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              Criar Carrossel
            </Link>
          </div>

          {carousels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {carousels.map((carousel) => {
                const colors = styleColors[carousel.visual_style] || ['#1A1A2E', '#2D2D44', '#F5F5F5'];
                return (
                  <div
                    key={carousel.id}
                    className="glass-card group overflow-hidden border border-[var(--border)] relative"
                  >
                    <Link href={`/editor/${carousel.id}`}>
                      <div
                        className="h-40 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                          <p
                            className="text-base font-bold leading-tight line-clamp-3"
                            style={{ color: colors[2] || '#F5F5F5' }}
                          >
                            {carousel.slides[0]?.headline || carousel.title}
                          </p>
                        </div>
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                          {carousel.slides.length} slides
                        </div>
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {carousel.title}
                          </h3>
                          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
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
                                onClick={() => handleDuplicateCarousel(carousel)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--foreground-secondary)] hover:bg-white/5 transition-colors text-left"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Duplicar
                              </button>
                              <button
                                onClick={() => handleDeleteCarousel(carousel.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left"
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
                            'slide-badge text-[9px]',
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
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border)] rounded-2xl bg-white/[0.01]">
              <FileImage className="w-8 h-8 text-[var(--foreground-muted)] mb-3" />
              <p className="text-sm text-[var(--foreground-secondary)] font-medium">
                Nenhum carrossel gerado neste projeto
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 mb-4">
                As informações que você preencher no Briefing serão usadas automaticamente.
              </p>
              <Link
                href={`/create?project_id=${project.id}`}
                className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                Gerar Primeiro Carrossel
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BRIEFING FORM */}
      {activeTab === 'briefing' && (
        <form onSubmit={handleSaveBriefing} className="glass-card p-6 border border-white/5 space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Briefing do Projeto</h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Essas informações servem de contexto base para a geração automática dos textos pela IA.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingBriefing}
              className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              {isSavingBriefing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : briefingSaved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSavingBriefing ? 'Salvando...' : briefingSaved ? 'Salvo!' : 'Salvar Briefing'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Nome da Empresa</label>
              <input
                type="text"
                placeholder="Ex: ACME Tech"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-dark w-full text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Logo URL (Imagem)</label>
              <input
                type="text"
                placeholder="Ex: https://dominio.com/logo.png"
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
                className="input-dark w-full text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Nome do Produto/Serviço</label>
              <input
                type="text"
                placeholder="Ex: Curso Postify Express"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="input-dark w-full text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Tom de Voz</label>
              <select
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
                className="input-dark w-full text-sm"
              >
                <option value="direto">Direto (vai ao ponto)</option>
                <option value="provocador">Provocador (desafiador)</option>
                <option value="premium">Premium (sofisticado)</option>
                <option value="didatico">Didático (educativo)</option>
                <option value="humanizado">Humanizado (próximo e empático)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Detalhes/Descrição do Produto</label>
            <textarea
              placeholder="Descreva o que é o seu produto, qual problema ele resolve, benefícios únicos, preços, etc."
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
              className="input-dark w-full text-sm min-h-[120px] leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Público-Alvo Detalhado</label>
            <textarea
              placeholder="Ex: Designers freelancers e profissionais de marketing que desejam aumentar suas vendas criando posts no Instagram de forma mais rápida."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="input-dark w-full text-sm min-h-[80px] leading-relaxed"
            />
          </div>
        </form>
      )}

      {/* TAB 3: ASSETS & REFERENCES */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Photos */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Fotos do Produto</h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Carregue fotos ou imagens do seu produto/empresa para manter arquivado neste projeto.
              </p>
            </div>

            <FileUploader
              projectId={project.id}
              onUploadComplete={(url, name, size) => handleAssetUpload('product_photos', url, name, size)}
            />

            {/* List */}
            {project.product_photos && project.product_photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {project.product_photos.map((asset, index) => (
                  <div key={index} className="relative rounded-xl border border-[var(--border)] overflow-hidden group h-32 bg-black/20">
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <span className="text-[10px] font-semibold text-white truncate max-w-full">{asset.name}</span>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset('product_photos', index)}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--foreground-muted)] text-center py-6 border border-dashed border-[var(--border)] rounded-lg">
                Nenhuma foto do produto adicionada ainda.
              </p>
            )}
          </div>

          {/* Reference Carousels */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Carrosséis de Referência</h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Anexe designs de carrosséis do Instagram que servem de base/inspiração para a criação.
              </p>
            </div>

            <FileUploader
              projectId={project.id}
              onUploadComplete={(url, name, size) => handleAssetUpload('reference_carousels', url, name, size)}
            />

            {/* List */}
            {project.reference_carousels && project.reference_carousels.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {project.reference_carousels.map((asset, index) => (
                  <div key={index} className="relative rounded-xl border border-[var(--border)] overflow-hidden group h-32 bg-black/20">
                    {asset.url.startsWith('data:image/') || asset.url.includes('.png') || asset.url.includes('.jpg') || asset.url.includes('.jpeg') || asset.url.includes('webp') || asset.url.startsWith('data:') ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                        <FileImage className="w-8 h-8 text-[var(--foreground-muted)]" />
                        <span className="text-[10px] text-[var(--foreground-muted)] truncate max-w-full mt-1">{asset.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <span className="text-[10px] font-semibold text-white truncate max-w-full">{asset.name}</span>
                      <div className="flex items-center justify-between">
                        {asset.url.startsWith('http') && (
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset('reference_carousels', index)}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--foreground-muted)] text-center py-6 border border-dashed border-[var(--border)] rounded-lg">
                Nenhuma imagem de referência adicionada ainda.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
