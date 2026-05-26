'use client';

import Link from 'next/link';
import { LayoutTemplate, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Template } from '@/types/brand-kit';

interface TemplateCardProps {
  template: Template;
  styleLabel?: string;
  styleColors?: string[];
}

export function TemplateCard({ template, styleLabel, styleColors }: TemplateCardProps) {
  const colors = styleColors ?? ['#7C3AED', '#A78BFA', '#5B21B6', '#F8FAFC'];

  return (
    <div className="glass-card group overflow-hidden flex flex-col">
      {/* Visual Preview */}
      <div
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2] ?? colors[0]} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex flex-col items-center gap-2 text-white/90">
          <LayoutTemplate className="w-8 h-8" />
          <span className="text-sm font-semibold tracking-wide">
            {styleLabel ?? 'Estilo Visual'}
          </span>
        </div>

        {/* Decorative slide lines */}
        <div className="absolute bottom-4 left-4 right-4 space-y-1.5 opacity-40">
          <div className="h-1.5 rounded-full bg-white/60 w-3/4" />
          <div className="h-1.5 rounded-full bg-white/40 w-1/2" />
          <div className="h-1.5 rounded-full bg-white/30 w-2/3" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">
            {template.name}
          </h3>
          <span
            className={cn(
              'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full',
              'text-[10px] font-semibold uppercase tracking-wider',
              'bg-[var(--primary)]/15 text-[var(--primary-light)]'
            )}
          >
            {template.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(template.created_at)}</span>
        </div>

        <div className="mt-auto">
          <Link
            href={`/create?template=${template.id}`}
            className={cn(
              'btn-gradient flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
            )}
          >
            Usar Template
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
