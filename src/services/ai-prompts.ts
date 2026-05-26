import { CarouselGenerationParams } from '@/types/carousel';
import { Project } from '@/types/brand-kit';

export function buildSystemPrompt(params: CarouselGenerationParams, project?: Project): string {
  const projectContextInfo = project ? `
CONTEXTO DETALHADO DO PROJETO E DO PRODUTO:
- Nome da Empresa/Marca: ${project.company_name || 'N/A'}
- Nome do Produto/Serviço: ${project.product_name || 'N/A'}
- Descrição do Produto/Serviço: ${project.product_details || 'N/A'}
- Público-Alvo Detalhado: ${project.target_audience || 'N/A'}
- Tom de voz preferido: ${project.brand_tone || 'direto'}
${project.product_photos?.length ? `- Imagens do produto anexadas: ${project.product_photos.map(p => p.name).join(', ')}` : ''}
${project.reference_carousels?.length ? `- Carrosséis de referência anexados para inspiração: ${project.reference_carousels.map(p => p.name).join(', ')}` : ''}
` : '';

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

REGRA DE DESIGN LAYOUT (canvas_data):
Cada slide deve sugerir um dos seguintes layouts em "canvas_data": {"layout": "cover|big_number|split|quote|clean|cta"}.
- Slide 1 (role: hook): usar sempre 'cover'
- Slides intermediários (role: content|authority|proof|transition): mesclar entre 'big_number', 'split', 'quote' e 'clean' de forma dinâmica
- Slide final (role: cta): usar sempre 'cta'

CONTEXTO DO CARROSSEL:
- Tema: ${params.theme}
- Nicho: ${params.niche}
- Público-alvo: ${params.audience}
- Objetivo: ${params.objective}
- Tom de voz: ${params.tone}
- Estilo visual: ${params.visual_style}
- Quantidade de slides: ${params.slide_count}
${projectContextInfo}

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
      "cta": null,
      "canvas_data": {
        "layout": "cover"
      }
    }
  ],
  "caption": "legenda para Instagram (com emojis e quebras de linha)",
  "hashtags": ["#exemplo"]
}

Gere EXATAMENTE ${params.slide_count} slides. Responda APENAS com o JSON, sem markdown ou explicações.`;
}

export function buildUserPrompt(params: CarouselGenerationParams, project?: Project): string {
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

  const projectUserContext = project ? `
Considere o produto/serviço "${project.product_name || 'N/A'}" da empresa/marca "${project.company_name || 'N/A'}".
Informações adicionais do briefing do produto: ${project.product_details || 'N/A'}
` : '';

  return `Crie um carrossel de ${params.slide_count} slides sobre "${params.theme}" para o nicho de ${params.niche}.
${projectUserContext}
Público: ${params.audience}
Objetivo: ${objectiveMap[params.objective]}
Tom: ${toneMap[params.tone]}

O carrossel deve ser impossível de ignorar. O primeiro slide deve parar o scroll instantaneamente.`;
}
