'use client';

import { FolderOpen, Calendar, Layers } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Collection } from '@/types/brand-kit';

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const count = collection.carousel_count ?? 0;

  return (
    <div
      className="glass-card group overflow-hidden flex"
      style={{ borderLeftWidth: '4px', borderLeftColor: collection.color }}
    >
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${collection.color}20` }}
          >
            <FolderOpen
              className="w-5 h-5"
              style={{ color: collection.color }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
              {collection.name}
            </h3>

            <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--foreground-muted)]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(collection.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)]">
            <Layers className="w-3.5 h-3.5" />
            <span>
              {count} {count === 1 ? 'carrossel' : 'carrosséis'}
            </span>
          </div>

          <div
            className="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: collection.color }}
          />
        </div>
      </div>
    </div>
  );
}
