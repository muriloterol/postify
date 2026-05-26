'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Plus, X, Check, Loader2 } from 'lucide-react';
import { CollectionCard } from '@/components/collections/collection-card';
import { COLLECTION_COLORS } from '@/lib/constants';
import type { Collection } from '@/types/brand-kit';
import { fetchCollections, saveCollection, fetchCarousels } from '@/services/db-service';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);

  const loadCollections = async () => {
    setIsLoading(true);
    const cols = await fetchCollections();
    const carousels = await fetchCarousels();
    
    // Map carousel counts dynamically
    const mappedCols = cols.map(col => ({
      ...col,
      carousel_count: carousels.filter(c => c.collection_id === col.id).length
    }));
    
    setCollections(mappedCols);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const newCollection: Collection = {
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000000',
      name: trimmed,
      color: selectedColor,
      icon: 'folder',
      carousel_count: 0,
      created_at: new Date().toISOString(),
    };

    const success = await saveCollection(newCollection);
    if (success) {
      setCollections((prev) => [newCollection, ...prev]);
      setNewName('');
      setSelectedColor(COLLECTION_COLORS[0]);
      setShowForm(false);
    } else {
      alert('Erro ao criar coleção.');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-[var(--primary-light)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)]">
                Coleções
              </h1>
              <p className="text-sm text-[var(--foreground-muted)]">
                Organize seus carrosséis por cliente, campanha ou tema
              </p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Coleção
            </button>
          )}
        </div>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <div className="glass-card p-5 mb-8 animate-fade-in">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
            Criar nova coleção
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Nome da coleção..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="input-dark flex-1 px-4 py-2.5 text-sm"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--foreground-muted)] mr-1 shrink-0">Cor:</span>
              {COLLECTION_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="color-swatch shrink-0"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? 'var(--foreground)' : undefined,
                    boxShadow:
                      selectedColor === color
                        ? `0 0 8px ${color}60`
                        : undefined,
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="btn-gradient flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Criar
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewName('');
                setSelectedColor(COLLECTION_COLORS[0]);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-[var(--foreground-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
            Nenhuma coleção ainda
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] text-center max-w-sm mb-4">
            Crie coleções para organizar seus carrosséis por cliente, campanha ou tema.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Coleção
          </button>
        </div>
      )}
    </div>
  );
}
