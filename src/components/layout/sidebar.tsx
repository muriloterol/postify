'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Palette,
  LayoutTemplate,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Criar Carrossel', icon: PlusCircle },
  { href: '/brand-kit', label: 'Brand Kit', icon: Palette },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/collections', label: 'Coleções', icon: FolderOpen },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  // Don't render sidebar on editor page
  if (pathname?.startsWith('/editor')) return null;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out',
        'bg-[var(--background-secondary)] border-r border-[var(--border)]',
        sidebarCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-[var(--header-height)] px-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] opacity-0 group-hover:opacity-40 blur-lg transition-opacity" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-[var(--foreground)] tracking-tight font-[var(--font-heading)]">
                Postify
              </span>
              <span className="text-[10px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                AI Studio
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--primary)]/15 text-[var(--primary-light)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] hover:bg-white/[0.03]'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-[var(--primary-light)]' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground-secondary)]'
                  )}
                />
                {isActive && (
                  <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--primary-light)]" />
                )}
              </div>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* AI Mode Indicator */}
      <div className={cn('px-3 pb-3', sidebarCollapsed && 'px-2')}>
        <div className={cn(
          'rounded-xl p-3 border border-[var(--border)]',
          'bg-gradient-to-br from-[var(--primary)]/5 to-transparent'
        )}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-xs font-medium text-[var(--foreground-muted)]">
                Modo Mock Ativo
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20 z-50 w-6 h-6 rounded-full',
          'bg-[var(--surface)] border border-[var(--border)]',
          'flex items-center justify-center',
          'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
          'transition-all duration-200 hover:bg-[var(--surface-hover)]',
          'opacity-0 hover:opacity-100 group-hover:opacity-100'
        )}
        style={{ opacity: 1 }}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
