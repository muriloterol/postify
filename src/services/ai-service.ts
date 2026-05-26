import { CarouselGenerationParams, GeneratedCarousel, GeneratedSlide } from '@/types/carousel';
import { Project } from '@/types/brand-kit';
import { buildSystemPrompt, buildUserPrompt } from './ai-prompts';

export type AIProvider = 'mock' | 'openai' | 'gemini';

export async function generateCarousel(
  params: CarouselGenerationParams,
  provider: AIProvider = 'mock',
  apiKey?: string,
  project?: Project
): Promise<GeneratedCarousel> {
  switch (provider) {
    case 'openai':
      return generateWithOpenAI(params, apiKey!, project);
    case 'gemini':
      return generateWithGemini(params, apiKey!, project);
    case 'mock':
    default:
      return generateMock(params);
  }
}

async function generateWithOpenAI(
  params: CarouselGenerationParams,
  apiKey: string,
  project?: Project
): Promise<GeneratedCarousel> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave de API do OpenAI não configurada. Vá em Configurações para adicioná-la.');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt(params, project) },
        { role: 'user', content: buildUserPrompt(params, project) },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao gerar com OpenAI');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content) as GeneratedCarousel;
}

async function generateWithGemini(
  params: CarouselGenerationParams,
  apiKey: string,
  project?: Project
): Promise<GeneratedCarousel> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave de API do Gemini não configurada. Vá em Configurações para adicioná-la.');
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildSystemPrompt(params, project) + '\n\n' + buildUserPrompt(params, project) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao gerar com Gemini');
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content) as GeneratedCarousel;
}

async function generateMock(params: CarouselGenerationParams): Promise<GeneratedCarousel> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mockSlides: GeneratedSlide[] = [];
  const slideCount = params.slide_count;

  // Generate slides based on theme and style
  const hookHeadlines: Record<string, string[]> = {
    educar: [
      '90% das pessoas erram isso',
      'O que ninguém te conta sobre',
      'Pare de cometer esse erro',
    ],
    autoridade: [
      'Depois de 500+ clientes',
      'O método que usamos para',
      'Por que os melhores escolhem',
    ],
    venda: [
      'Sua última chance de',
      'Antes: R$2.997 → Agora: R$497',
      'Vagas limitadas para',
    ],
    engajamento: [
      'Salva esse post AGORA',
      'Concorda? Comenta 🔥',
      'Tag alguém que precisa ver isso',
    ],
    quebra_objecao: [
      '"Mas eu não tenho tempo"',
      '"É muito caro para mim"',
      'As 5 desculpas que te impedem',
    ],
  };

  const hooks = hookHeadlines[params.objective] || hookHeadlines.educar;
  const hookIndex = Math.floor(Math.random() * hooks.length);

  // Slide 1: Hook
  mockSlides.push({
    slideNumber: 1,
    role: 'hook',
    headline: `${hooks[hookIndex]}`,
    subtitle: `${params.theme}`,
    body: '',
    visualDirection: 'Texto grande centralizado, fundo com gradiente escuro, tipografia bold impactante',
    imagePrompt: `Background abstrato para post sobre ${params.theme}`,
    cta: null,
  });

  // Content slides
  const contentTopics = [
    'O primeiro passo que poucos conhecem',
    'A estratégia que muda o jogo',
    'O segredo está nos detalhes',
    'Como aplicar na prática',
    'O resultado que você pode esperar',
    'O erro mais comum',
    'A mentalidade certa para',
    'Dados que comprovam',
  ];

  for (let i = 1; i < slideCount - 1; i++) {
    const topicIndex = (i - 1) % contentTopics.length;
    const isAuthority = i === slideCount - 2;

    mockSlides.push({
      slideNumber: i + 1,
      role: isAuthority ? 'authority' : 'content',
      headline: `${String(i).padStart(2, '0')}. ${contentTopics[topicIndex]}`,
      subtitle: `Quando se trata de ${params.theme.toLowerCase()}, este ponto é crucial`,
      body: isAuthority
        ? 'Resultados comprovados com +200 clientes em 12 meses'
        : '',
      visualDirection: `Layout com número destaque, hierarquia visual forte, estilo ${params.visual_style}`,
      imagePrompt: '',
      cta: null,
    });
  }

  // Last slide: CTA
  const ctaTexts: Record<string, string> = {
    educar: 'Salve este post e compartilhe com quem precisa 📌',
    autoridade: 'Siga para mais conteúdo como este ➡️',
    venda: 'Link na bio → Garanta sua vaga agora 🔥',
    engajamento: 'Comenta "EU QUERO" que te envio o material 📩',
    quebra_objecao: 'Pronto para dar o próximo passo? Link na bio 👆',
  };

  mockSlides.push({
    slideNumber: slideCount,
    role: 'cta',
    headline: 'Gostou do conteúdo?',
    subtitle: ctaTexts[params.objective] || 'Siga para mais',
    body: '@seuprofile',
    visualDirection: 'CTA claro, botão visual ou seta indicativa, contraste alto',
    imagePrompt: '',
    cta: ctaTexts[params.objective] || 'Siga para mais',
  });

  return {
    title: `${params.theme} - ${params.niche}`,
    theme: params.theme,
    slides: mockSlides,
    caption: `🔥 ${params.theme}\n\nVocê sabia que a maioria das pessoas ignora completamente isso?\n\nNeste carrossel eu trouxe os pontos mais importantes que você PRECISA saber.\n\n📌 Salva esse post para consultar depois\n💬 Comenta qual ponto mais te surpreendeu\n📤 Compartilha com alguém que precisa ver isso\n\n#${params.niche.toLowerCase().replace(/\s/g, '')} #carrossel #conteudo #dicas`,
    hashtags: [
      `#${params.niche.toLowerCase().replace(/\s/g, '')}`,
      '#carrossel',
      '#conteudodigital',
      '#dicasinstagram',
      '#marketing',
    ],
  };
}
