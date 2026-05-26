'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import {
  Cpu,
  Key,
  Eye,
  EyeOff,
  Settings2,
  Sparkles,
  Zap,
  FlaskConical,
  Check,
  ChevronDown,
  Monitor,
} from 'lucide-react';

type AiProvider = 'mock' | 'openai' | 'gemini';

interface ProviderOption {
  id: AiProvider;
  name: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
}

const providers: ProviderOption[] = [
  {
    id: 'mock',
    name: 'Mock',
    description: 'Dados simulados para testes. Não requer chave de API.',
    badge: 'Gratuito',
    icon: <FlaskConical className="h-5 w-5" />,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o — geração de textos avançada e criativa.',
    badge: 'GPT-4o',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Gemini 2.0 Flash — rápido e eficiente.',
    badge: 'Gemini 2.0 Flash',
    icon: <Zap className="h-5 w-5" />,
  },
];

export default function SettingsPage() {
  const { aiProvider, openaiApiKey, geminiApiKey, setAiProvider, setOpenaiApiKey, setGeminiApiKey } = useAppStore();

  const [localOpenaiKey, setLocalOpenaiKey] = useState(openaiApiKey);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState<'1080x1350' | '1080x1080'>('1080x1350');
  const [defaultLanguage, setDefaultLanguage] = useState('pt-BR');
  const [prefsSaved, setPrefsSaved] = useState(false);

  function handleSaveApiKey() {
    if (aiProvider === 'openai') {
      setOpenaiApiKey(localOpenaiKey);
    } else if (aiProvider === 'gemini') {
      setGeminiApiKey(localGeminiKey);
    }
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  function handleSavePreferences() {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  return (
    <div className="min-h-full bg-[var(--background)] p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
            Configurações
          </h1>
          <p className="text-[var(--foreground-secondary)]">
            Gerencie suas preferências e integrações
          </p>
        </div>

        {/* Section 1: AI Provider */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[var(--primary-light)]" />
            <h2 className="text-lg font-semibold text-white">Provedor de IA</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {providers.map((provider) => {
              const isSelected = aiProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setAiProvider(provider.id)}
                  className={cn(
                    'glass-card relative flex flex-col items-start gap-3 p-5 text-left transition-all',
                    isSelected && 'glow-purple !border-[var(--primary)]',
                    !isSelected && 'hover:border-[var(--border-hover)]'
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isSelected
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface)] text-[var(--foreground-secondary)]'
                    )}
                  >
                    {provider.icon}
                  </div>

                  {/* Text */}
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{provider.name}</p>
                    <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                      {provider.description}
                    </p>
                  </div>

                  {/* Badge */}
                  <span
                    className={cn(
                      'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      isSelected
                        ? 'bg-[var(--primary)]/20 text-[var(--primary-light)]'
                        : 'bg-[var(--surface)] text-[var(--foreground-muted)]'
                    )}
                  >
                    {provider.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: API Key (hidden when mock) */}
        {aiProvider !== 'mock' && (
          <section className="glass-card space-y-5 p-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[var(--primary-light)]" />
              <h2 className="text-lg font-semibold text-white">Chave de API</h2>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-[var(--foreground-secondary)]"
              >
                {aiProvider === 'openai' ? 'OpenAI API Key' : 'Google AI API Key'}
              </label>

              <div className="relative">
                <input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={aiProvider === 'openai' ? localOpenaiKey : localGeminiKey}
                  onChange={(e) => aiProvider === 'openai' ? setLocalOpenaiKey(e.target.value) : setLocalGeminiKey(e.target.value)}
                  placeholder={
                    aiProvider === 'openai'
                      ? 'sk-proj-...'
                      : 'AIzaSy...'
                  }
                  className="input-dark w-full py-2.5 pl-4 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground-secondary)]"
                  aria-label={showApiKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-[var(--foreground-muted)]">
                {aiProvider === 'openai' ? (
                  <>
                    Obtenha sua chave em{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary-light)] underline underline-offset-2 hover:text-[var(--primary)]"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </>
                ) : (
                  <>
                    Obtenha sua chave em{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary-light)] underline underline-offset-2 hover:text-[var(--primary)]"
                    >
                      aistudio.google.com/apikey
                    </a>
                  </>
                )}
                . Sua chave é armazenada localmente e nunca é enviada para nossos servidores.
              </p>

              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={aiProvider === 'openai' ? !localOpenaiKey.trim() : !localGeminiKey.trim()}
                className={cn(
                  'btn-gradient mt-1 inline-flex items-center gap-2 px-5 py-2 text-sm',
                  (aiProvider === 'openai' ? !localOpenaiKey.trim() : !localGeminiKey.trim()) && 'cursor-not-allowed opacity-50'
                )}
              >
                {keySaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Salvo!
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </section>
        )}

        {/* Section 3: Preferences */}
        <section className="glass-card space-y-6 p-6">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-[var(--primary-light)]" />
            <h2 className="text-lg font-semibold text-white">Preferências</h2>
          </div>

          {/* Default Format */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
              <Monitor className="h-4 w-4" />
              Formato padrão dos slides
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDefaultFormat('1080x1350')}
                className={cn(
                  'pill-selector',
                  defaultFormat === '1080x1350' && 'active'
                )}
              >
                <span className="inline-block h-5 w-4 rounded-sm border border-current" />
                1080 × 1350
              </button>
              <button
                type="button"
                onClick={() => setDefaultFormat('1080x1080')}
                className={cn(
                  'pill-selector',
                  defaultFormat === '1080x1080' && 'active'
                )}
              >
                <span className="inline-block h-4 w-4 rounded-sm border border-current" />
                1080 × 1080
              </button>
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              {defaultFormat === '1080x1350'
                ? 'Formato retrato — ideal para posts de feed do Instagram.'
                : 'Formato quadrado — compatível com todas as plataformas.'}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Default Language */}
          <div className="space-y-3">
            <label
              htmlFor="language-select"
              className="block text-sm font-medium text-[var(--foreground-secondary)]"
            >
              Idioma padrão do conteúdo
            </label>
            <div className="relative w-full max-w-xs">
              <select
                id="language-select"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="input-dark w-full appearance-none py-2.5 pl-4 pr-10 text-sm"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Define o idioma usado na geração de conteúdo por IA.
            </p>
          </div>

          {/* Save Preferences */}
          <button
            type="button"
            onClick={handleSavePreferences}
            className="btn-gradient inline-flex items-center gap-2 px-5 py-2 text-sm"
          >
            {prefsSaved ? (
              <>
                <Check className="h-4 w-4" />
                Salvo!
              </>
            ) : (
              'Salvar preferências'
            )}
          </button>
        </section>
      </div>
    </div>
  );
}
