'use client';

import { useEffect, useState } from 'react';
import {
  Palette,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandKit } from '@/types/brand-kit';
import { DEFAULT_FONTS, TONES } from '@/lib/constants';
import { fetchBrandKits, saveBrandKit, deleteBrandKit } from '@/services/db-service';

export default function BrandKitPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<BrandKit | null>(null);

  const [form, setForm] = useState({
    name: '',
    color_palette: ['#7C3AED', '#FFFFFF'],
    primary_font: 'Inter',
    secondary_font: 'DM Sans',
    tone_of_voice: 'direto',
    forbidden_words: '',
    writing_references: '',
    audience_description: '',
  });

  const loadKits = async () => {
    setIsLoading(true);
    const data = await fetchBrandKits();
    setKits(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadKits();
  }, []);

  const openForm = (kit?: BrandKit) => {
    if (kit) {
      setEditingKit(kit);
      setForm({
        name: kit.name,
        color_palette: kit.color_palette,
        primary_font: kit.primary_font,
        secondary_font: kit.secondary_font,
        tone_of_voice: kit.tone_of_voice,
        forbidden_words: kit.forbidden_words.join(', '),
        writing_references: kit.writing_references,
        audience_description: kit.audience_description,
      });
    } else {
      setEditingKit(null);
      setForm({
        name: '',
        color_palette: ['#7C3AED', '#FFFFFF'],
        primary_font: 'Inter',
        secondary_font: 'DM Sans',
        tone_of_voice: 'direto',
        forbidden_words: '',
        writing_references: '',
        audience_description: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const kit: BrandKit = {
      id: editingKit?.id || crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000000',
      name: form.name,
      logo_url: null,
      color_palette: form.color_palette,
      primary_font: form.primary_font,
      secondary_font: form.secondary_font,
      tone_of_voice: form.tone_of_voice,
      forbidden_words: form.forbidden_words.split(',').map(w => w.trim()).filter(Boolean),
      writing_references: form.writing_references,
      audience_description: form.audience_description,
      created_at: editingKit?.created_at || new Date().toISOString(),
    };

    const success = await saveBrandKit(kit);
    if (success) {
      loadKits();
      setIsFormOpen(false);
    } else {
      alert('Erro ao salvar o Brand Kit no banco de dados.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este Brand Kit?')) {
      const success = await deleteBrandKit(id);
      if (success) {
        setKits(prev => prev.filter(k => k.id !== id));
      } else {
        alert('Erro ao excluir o Brand Kit.');
      }
    }
  };

  const addColor = () => {
    setForm({ ...form, color_palette: [...form.color_palette, '#6366F1'] });
  };

  const removeColor = (index: number) => {
    setForm({ ...form, color_palette: form.color_palette.filter((_, i) => i !== index) });
  };

  const updateColor = (index: number, color: string) => {
    const palette = [...form.color_palette];
    palette[index] = color;
    setForm({ ...form, color_palette: palette });
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] font-[family-name:var(--font-jakarta)] tracking-tight">
            Brand Kit
          </h1>
          <p className="mt-1 text-[var(--foreground-muted)]">
            Gerencie identidades visuais dos seus clientes
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Criar Brand Kit
        </button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : kits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {kits.map((kit) => (
            <div key={kit.id} className="glass-card p-5 group">
              {/* Logo area */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 flex items-center justify-center mb-4">
                <span className="text-lg font-bold text-[var(--primary-light)]">
                  {kit.name.charAt(0)}
                </span>
              </div>

              <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">{kit.name}</h3>
              <p className="text-xs text-[var(--foreground-muted)] mb-4 line-clamp-1">
                {kit.audience_description}
              </p>

              {/* Color palette */}
              <div className="flex gap-1.5 mb-4">
                {kit.color_palette.map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-lg border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Fonts */}
              <div className="flex items-center gap-2 mb-4 text-xs text-[var(--foreground-muted)]">
                <span className="font-medium" style={{ fontFamily: kit.primary_font }}>{kit.primary_font}</span>
                <span>•</span>
                <span style={{ fontFamily: kit.secondary_font }}>{kit.secondary_font}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openForm(kit)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(kit.id)}
                  className="p-2 rounded-lg border border-[var(--border)] text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:border-[var(--danger)]/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 flex items-center justify-center mb-6">
            <Palette className="w-10 h-10 text-[var(--primary-light)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Nenhum Brand Kit</h3>
          <p className="text-sm text-[var(--foreground-muted)] mb-6 text-center max-w-sm">
            Crie identidades visuais para seus clientes e mantenha consistência nos carrosséis.
          </p>
          <button
            onClick={() => openForm()}
            className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Brand Kit
          </button>
        </div>
      )}

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {editingKit ? 'Editar Brand Kit' : 'Novo Brand Kit'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5 text-[var(--foreground-muted)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="property-label block">Nome da Marca *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="Ex: Formed Academy"
                />
              </div>

              <div>
                <label className="property-label block">Paleta de Cores</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {form.color_palette.map((color, i) => (
                    <div key={i} className="relative group/swatch">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(i, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-[var(--border)] cursor-pointer"
                      />
                      {form.color_palette.length > 1 && (
                        <button
                          onClick={() => removeColor(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--danger)] flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addColor}
                    className="w-10 h-10 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="property-label block">Fonte Principal</label>
                  <select
                    value={form.primary_font}
                    onChange={(e) => setForm({ ...form, primary_font: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm"
                  >
                    {DEFAULT_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="property-label block">Fonte Secundária</label>
                  <select
                    value={form.secondary_font}
                    onChange={(e) => setForm({ ...form, secondary_font: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-sm"
                  >
                    {DEFAULT_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="property-label block">Tom de Voz</label>
                <select
                  value={form.tone_of_voice}
                  onChange={(e) => setForm({ ...form, tone_of_voice: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-sm"
                >
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="property-label block">Palavras Proibidas</label>
                <input
                  type="text"
                  value={form.forbidden_words}
                  onChange={(e) => setForm({ ...form, forbidden_words: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm"
                  placeholder="Separar por vírgula: barato, promoção, grátis"
                />
              </div>

              <div>
                <label className="property-label block">Referências de Escrita</label>
                <textarea
                  value={form.writing_references}
                  onChange={(e) => setForm({ ...form, writing_references: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm resize-none"
                  rows={2}
                  placeholder="Descreva o estilo de escrita desejado"
                />
              </div>

              <div>
                <label className="property-label block">Público-Alvo</label>
                <textarea
                  value={form.audience_description}
                  onChange={(e) => setForm({ ...form, audience_description: e.target.value })}
                  className="input-dark w-full px-3 py-2.5 text-sm resize-none"
                  rows={2}
                  placeholder="Descreva o público-alvo desta marca"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name}
                className={cn(
                  'flex-1 btn-gradient flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold',
                  !form.name && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
