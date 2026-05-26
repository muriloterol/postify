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
      return generateMock(params, project);
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

async function generateMock(params: CarouselGenerationParams, project?: Project): Promise<GeneratedCarousel> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const mockSlides: GeneratedSlide[] = [];
  const slideCount = params.slide_count;

  const brand = project?.company_name || 'Postify Studio';
  const product = project?.product_name || 'seu produto';
  const handle = project?.company_name ? `@${project.company_name.toLowerCase().replace(/\s/g, '')}` : '@seuprofile';

  // Customize slides dynamically based on the theme & niche
  // Slide 1: Cover (Hook)
  mockSlides.push({
    slideNumber: 1,
    role: 'hook',
    headline: `Como dominar ${params.theme || 'Conteúdo Viral'}`,
    subtitle: `Um guia prático para o nicho de ${params.niche || 'Instagram'}`,
    body: project?.company_name ? `Apresentado por ${project.company_name}` : 'Arraste para o lado para aprender',
    visualDirection: 'Visual de alto impacto, título em caixa alta, tipografia display extra bold',
    imagePrompt: '',
    cta: null,
    canvas_data: { layout: 'cover' }
  });

  // Intermediary slides (alternating layouts)
  const steps = [
    {
      title: 'O Maior Erro',
      desc: `Ignorar a estratégia de ${params.theme} é o que impede 90% das marcas de crescerem no nicho de ${params.niche}.`
    },
    {
      title: 'A Solução Simples',
      desc: `Ao focar em valor real e resolver as dores reais do seu público, você se torna a escolha natural.`
    },
    {
      title: 'Como Aplicar Agora',
      desc: `Crie um processo estruturado, meça os feedbacks e faça melhorias constantes toda semana.`
    },
    {
      title: 'Otimização com IA',
      desc: `Utilize ferramentas modernas para economizar tempo e otimizar toda a sua produção de conteúdo.`
    },
    {
      title: 'Foque em Retenção',
      desc: 'Os primeiros 3 segundos do seu post definem se o usuário vai salvar ou ignorar seu conteúdo.'
    }
  ];

  for (let i = 1; i < slideCount - 1; i++) {
    const stepData = steps[(i - 1) % steps.length];
    const isAuthority = i === slideCount - 2;
    
    // Distribute layouts
    const layouts = ['big_number', 'split', 'quote', 'clean'];
    const layout = layouts[(i - 1) % layouts.length];

    mockSlides.push({
      slideNumber: i + 1,
      role: isAuthority ? 'authority' : 'content',
      headline: isAuthority ? `Nosso Método na ${brand}` : `${i}. ${stepData.title}`,
      subtitle: isAuthority 
        ? `Como ajudamos clientes de ${params.niche} a obter mais resultados`
        : `Passo fundamental para o sucesso com ${params.theme}`,
      body: isAuthority
        ? `Aplicamos essas exatas etapas no ${product} para impulsionar o engajamento.`
        : stepData.desc,
      visualDirection: `Estilo premium com tipografia elegante e layout ${layout}`,
      imagePrompt: '',
      cta: null,
      canvas_data: { layout }
    });
  }

  // Last slide: CTA
  const ctaTexts: Record<string, string> = {
    educar: 'Salve este post para consultar mais tarde 📌',
    autoridade: 'Siga nosso perfil para receber mais conteúdos ➡️',
    venda: `Acesse o link na bio e garanta o seu ${product} agora 🔥`,
    engajamento: 'Comente abaixo o que você achou dessa estratégia! 💬',
    quebra_objecao: `Tem alguma dúvida sobre ${product}? Envie no Direct! 📩`,
  };

  mockSlides.push({
    slideNumber: slideCount,
    role: 'cta',
    headline: 'Pronto para começar?',
    subtitle: ctaTexts[params.objective] || 'Siga para mais novidades',
    body: handle,
    visualDirection: 'Slide de conversão, CTA em destaque com botão visual',
    imagePrompt: '',
    cta: ctaTexts[params.objective] || 'Siga para mais',
    canvas_data: { layout: 'cta' }
  });

  return {
    title: `${params.theme || 'Carrossel'} - ${brand}`,
    theme: params.theme,
    slides: mockSlides,
    caption: `🔥 Quer dominar ${params.theme}?\n\nNeste post, mostramos as principais etapas e estratégias práticas que aplicamos na ${brand} para obter o máximo de resultados no mercado.\n\n📌 Salve para não esquecer!\n💬 Comente qual ponto você achou mais interessante.\n\n#${params.niche.toLowerCase().replace(/\s/g, '')} #carrossel #marketingdigital #${brand.toLowerCase().replace(/\s/g, '')}`,
    hashtags: [
      `#${params.niche.toLowerCase().replace(/\s/g, '')}`,
      '#carrossel',
      '#conteudodigital',
      `#${brand.toLowerCase().replace(/\s/g, '')}`
    ]
  };
}
