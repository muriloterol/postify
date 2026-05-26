'use client';

import { useEffect, useState } from 'react';
import { LayoutTemplate, Search, PackageOpen, Loader2 } from 'lucide-react';
import { TemplateCard } from '@/components/templates/template-card';
import { VISUAL_STYLES } from '@/lib/constants';
import type { Template } from '@/types/brand-kit';
import { fetchTemplates } from '@/services/db-service';

function getStyleInfo(template: Template) {
  const styleKey = (template.template_data?.visual_style as string) ?? '';
  const match = VISUAL_STYLES.find((s) => s.value === styleKey);
  return {
    label: match?.label ?? 'Personalizado',
    colors: match?.colors ?? undefined,
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await fetchTemplates();
    setTemplates(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center">
            <LayoutTemplate className="w-5 h-5 text-[var(--primary-light)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
              Templates
            </h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Salve layouts e reutilize em novos carrosséis
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8 animate-fade-in">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Buscar templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-dark w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
          {filtered.map((template) => {
            const { label, colors } = getStyleInfo(template);
            return (
              <TemplateCard
                key={template.id}
                template={template}
                styleLabel={label}
                styleColors={colors}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
            <PackageOpen className="w-8 h-8 text-[var(--foreground-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
            Nenhum template encontrado
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] text-center max-w-sm">
            {search
              ? 'Tente buscar com outros termos.'
              : 'Crie um carrossel e salve como template para reutilizar depois.'}
          </p>
        </div>
      )}
    </div>
  );
}
