'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Search,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  FileImage,
  TrendingUp,
  Clock,
  Download,
  FolderPlus,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { Carousel } from '@/types/carousel';
import { Project } from '@/types/brand-kit';
import { fetchProjects, saveProject, deleteProject, fetchCarousels } from '@/services/db-service';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [fetchedProjects, fetchedCarousels] = await Promise.all([
      fetchProjects(),
      fetchCarousels(),
    ]);
    setProjects(fetchedProjects);
    setCarousels(fetchedCarousels);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    setIsCreating(true);
    const newProjectId = crypto.randomUUID();
    const newProject: Project = {
      id: newProjectId,
      user_id: '00000000-0000-0000-0000-000000000000',
      name: newProjName,
      description: newProjDesc || null,
      company_name: '',
      company_logo_url: '',
      product_name: '',
      product_details: '',
      target_audience: '',
      brand_tone: 'direto',
      product_photos: [],
      reference_carousels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const success = await saveProject(newProject);
    if (success) {
      setNewProjName('');
      setNewProjDesc('');
      setIsModalOpen(false);
      // Redirect to the newly created project so they can fill briefing & generate
      router.push(`/projects/${newProjectId}`);
    } else {
      alert('Erro ao criar projeto.');
    }
    setIsCreating(false);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Deseja realmente excluir esta pasta de projeto? Todos os carrosséis dentro dela serão removidos.')) {
      const success = await deleteProject(id);
      if (success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    }
    setOpenMenu(null);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      return (
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [projects, searchQuery]);

  // Project statistics helper
  const projectCarouselsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.id] = carousels.filter(c => c.project_id === p.id).length;
    });
    return counts;
  }, [projects, carousels]);

  const stats = useMemo(() => {
    return {
      projectsTotal: projects.length,
      carouselsTotal: carousels.length,
      completed: carousels.filter((c) => c.status === 'completed').length,
      exported: carousels.filter((c) => c.status === 'exported').length,
    };
  }, [projects, carousels]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-jakarta)] tracking-tight">
            Projetos
          </h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            Crie pastas de projeto para organizar briefs, produtos e gerar carrosséis com IA.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          Nova Pasta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          { label: 'Pastas de Projeto', value: stats.projectsTotal, icon: FolderOpen, color: 'var(--primary)' },
          { label: 'Total de Carrosséis', value: stats.carouselsTotal, icon: FileImage, color: 'var(--info)' },
          { label: 'Prontos para Postar', value: stats.completed, icon: Clock, color: 'var(--success)' },
          { label: 'Carrosséis Exportados', value: stats.exported, icon: Download, color: 'var(--accent)' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-1 text-white">
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

      {/* Search & Actions */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Buscar pastas de projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filteredProjects.map((project) => {
            const count = projectCarouselsCount[project.id] || 0;
            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="glass-card group overflow-hidden cursor-pointer hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-black/20 transition-all p-5 flex flex-col justify-between h-48 relative border border-[var(--border)]"
              >
                {/* Folder Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary-light)] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-white group-hover:text-[var(--primary-light)] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-mono">
                        {count} {count === 1 ? 'carrossel' : 'carrosséis'}
                      </span>
                    </div>
                  </div>

                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                      className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </button>

                    {openMenu === project.id && (
                      <div className="absolute right-0 top-8 z-50 w-40 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir Pasta
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Folder Body */}
                <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2 mt-4 leading-relaxed flex-1">
                  {project.description || 'Nenhuma descrição adicionada.'}
                </p>

                {/* Footer link indicator */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-[var(--foreground-muted)]">
                  <span>Criado {formatRelativeDate(project.created_at)}</span>
                  <span className="flex items-center gap-1 text-[var(--primary-light)] opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir pasta <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-[var(--primary-light)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Nenhuma pasta de projeto
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] mb-6 max-w-sm text-center leading-relaxed">
            Antes de criar um carrossel, você precisa criar uma pasta de projeto para acumular briefs, referências e ativos.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Criar Minha Primeira Pasta
          </button>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 border border-white/10 relative animate-scale-up">
            <h2 className="text-xl font-bold text-white mb-4">Nova Pasta de Projeto</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Nome do Projeto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lançamento Produto X, Feed Dra. Eli"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="input-dark w-full text-sm"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Descrição</label>
                <textarea
                  placeholder="Objetivos principais deste projeto..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="input-dark w-full text-sm min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-gradient px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  Criar e Abrir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
