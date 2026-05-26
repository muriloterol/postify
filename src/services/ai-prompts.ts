import { CarouselGenerationParams, GeneratedCarousel, GeneratedSlide } from '@/types/carousel';

export function buildSystemPrompt(params: CarouselGenerationParams): string {
  return `Você é um copywriter especialista em carrosséis virais para Instagram. 
Sua missão é criar conteúdo que gera PARADAS DE SCROLL, salvamentos e compartilhamentos.

REGRAS OBRIGATÓRIAS DE COPY:
1. NUNCA use texto genérico com cara de IA
2. NUNCA use frases clichês como "Você sabia que...", "Neste post vamos...", "Fique até o final..."
3. O primeiro slide DEVE ter um gancho que para o scroll em 3 segundos
4. Cada slide deve ter POUCO texto - máximo 3 linhas de headline
5. A sequência deve criar CURIOSIDADE para continuar arrastando
6. O último slide DEVE ter um CTA claro e direto
7. O texto deve ser natural, direto e com potencial de retenção
8. Use linguagem que o público realmente usa no dia a dia
9. Priorize dados, números e provas sociais quando possível
10. Cada slide deve ter uma função clara na narrativa

ESTRUTURA DE SLIDE:
- Hook (slide 1): Gancho forte, promessa ou provocação
- Content (slides intermediários): Entrega de valor, cada um com um ponto
- Authority/Proof: Dados, resultados, provas
- CTA (último slide): Chamada para ação clara

CONTEXTO DO CARROSSEL:
- Tema: ${params.theme}
- Nicho: ${params.niche}
- Público-alvo: ${params.audience}
- Objetivo: ${params.objective}
- Tom de voz: ${params.tone}
- Estilo visual: ${params.visual_style}
- Quantidade de slides: ${params.slide_count}

FORMATO DE RESPOSTA (JSON):
{
  "title": "nome do carrossel",
  "theme": "${params.theme}",
  "slides": [
    {
      "slideNumber": 1,
      "role": "hook|content|authority|proof|cta",
      "headline": "título curto e forte (máx 8 palavras)",
      "subtitle": "subtítulo complementar (máx 12 palavras)",
      "body": "texto do slide se houver (máx 25 palavras)",
      "visualDirection": "descrição visual do slide",
      "imagePrompt": "prompt para gerar imagem se necessário",
      "cta": null
    }
  ],
  "caption": "legenda para Instagram (com emojis e quebras de linha)",
  "hashtags": ["#exemplo"]
}

Gere EXATAMENTE ${params.slide_count} slides. Responda APENAS com o JSON, sem markdown ou explicações.`;
}

export function buildUserPrompt(params: CarouselGenerationParams): string {
  const objectiveMap: Record<string, string> = {
    educar: 'Educar o público sobre o tema',
    autoridade: 'Posicionar como autoridade/referência',
    venda: 'Gerar desejo e converter em vendas',
    engajamento: 'Maximizar salvamentos, compartilhamentos e comentários',
    quebra_objecao: 'Eliminar objeções e dúvidas do público',
  };

  const toneMap: Record<string, string> = {
    direto: 'Tom direto, sem enrolação, vai ao ponto',
    provocador: 'Tom provocador, desafia e gera reflexão',
    premium: 'Tom premium, sofisticado e exclusivo',
    didatico: 'Tom didático, passo a passo claro e acessível',
    humanizado: 'Tom humanizado, próximo e empático',
  };

  return `Crie um carrossel de ${params.slide_count} slides sobre "${params.theme}" para o nicho de ${params.niche}.

Público: ${params.audience}
Objetivo: ${objectiveMap[params.objective]}
Tom: ${toneMap[params.tone]}

O carrossel deve ser impossível de ignorar. O primeiro slide deve parar o scroll instantaneamente.`;
}
