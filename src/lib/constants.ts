import {
  CarouselObjective,
  CarouselTone,
  VisualStyle,
} from '@/types/carousel';

export const OBJECTIVES: { value: CarouselObjective; label: string; icon: string; description: string }[] = [
  { value: 'educar', label: 'Educar', icon: '📚', description: 'Ensinar algo valioso ao público' },
  { value: 'autoridade', label: 'Autoridade', icon: '👑', description: 'Posicionar como referência' },
  { value: 'venda', label: 'Venda', icon: '💰', description: 'Converter em clientes' },
  { value: 'engajamento', label: 'Engajamento', icon: '🔥', description: 'Gerar interação e salvamentos' },
  { value: 'quebra_objecao', label: 'Quebra de Objeção', icon: '🎯', description: 'Eliminar dúvidas e resistências' },
];

export const TONES: { value: CarouselTone; label: string; icon: string; description: string }[] = [
  { value: 'direto', label: 'Direto', icon: '⚡', description: 'Sem enrolação, vai ao ponto' },
  { value: 'provocador', label: 'Provocador', icon: '🔥', description: 'Desafia e gera reflexão' },
  { value: 'premium', label: 'Premium', icon: '✨', description: 'Sofisticado e exclusivo' },
  { value: 'didatico', label: 'Didático', icon: '📖', description: 'Passo a passo claro' },
  { value: 'humanizado', label: 'Humanizado', icon: '💬', description: 'Próximo e empático' },
];

export const VISUAL_STYLES: { value: VisualStyle; label: string; description: string; colors: string[] }[] = [
  {
    value: 'minimalista_medico',
    label: 'Minimalista Médico',
    description: 'Limpo, branco, tons de azul claro e cinza',
    colors: ['#FFFFFF', '#E8F4FD', '#3B82F6', '#1E293B'],
  },
  {
    value: 'high_ticket_dark',
    label: 'High Ticket Dark',
    description: 'Escuro, gradientes, dourado e sofisticado',
    colors: ['#0A0A0A', '#1A1A2E', '#D4AF37', '#F5F5F5'],
  },
  {
    value: 'twitter_style',
    label: 'Twitter-Style',
    description: 'Fundo branco, texto grande, minimalista',
    colors: ['#FFFFFF', '#F7F9FA', '#0F1419', '#536471'],
  },
  {
    value: 'varejo_promocional',
    label: 'Varejo Promocional',
    description: 'Cores fortes, preços grandes, urgência',
    colors: ['#DC2626', '#FBBF24', '#FFFFFF', '#1F2937'],
  },
  {
    value: 'institucional_premium',
    label: 'Institucional Premium',
    description: 'Azul marinho, gradientes suaves, elegante',
    colors: ['#0F172A', '#1E3A5F', '#60A5FA', '#F8FAFC'],
  },
];

export const NICHES = [
  'Saúde',
  'Estética',
  'Fitness',
  'Marketing Digital',
  'Finanças',
  'Educação',
  'Moda',
  'Gastronomia',
  'Tecnologia',
  'Jurídico',
  'Imobiliário',
  'E-commerce',
  'Coaching',
  'Psicologia',
  'Odontologia',
  'Dermatologia',
  'Nutrição',
  'Arquitetura',
  'Fotografia',
  'Outro',
];

export const DEFAULT_FONTS = [
  'Inter',
  'Plus Jakarta Sans',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Playfair Display',
  'DM Sans',
  'Space Grotesk',
  'Outfit',
  'Sora',
  'Manrope',
  'Raleway',
  'Lato',
  'Nunito',
];

export const COLLECTION_COLORS = [
  '#6C5CE7',
  '#00B894',
  '#E17055',
  '#0984E3',
  '#FDCB6E',
  '#E84393',
  '#00CEC9',
  '#636E72',
  '#D63031',
  '#74B9FF',
];

export const SLIDE_DIMENSIONS = {
  '1080x1350': { width: 1080, height: 1350 },
  '1080x1080': { width: 1080, height: 1080 },
} as const;
