import { NextRequest, NextResponse } from 'next/server';
import { generateCarousel } from '@/services/ai-service';
import { CarouselGenerationParams } from '@/types/carousel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      theme,
      niche,
      audience,
      objective,
      tone,
      visual_style,
      format,
      slide_count,
      provider = 'mock',
      apiKey,
    } = body as CarouselGenerationParams & { provider: string; apiKey?: string };

    if (!theme || !niche || !audience) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: theme, niche, audience' },
        { status: 400 }
      );
    }

    const result = await generateCarousel(
      {
        theme,
        niche,
        audience,
        objective: objective || 'educar',
        tone: tone || 'direto',
        visual_style: visual_style || 'high_ticket_dark',
        format: format || '1080x1350',
        slide_count: slide_count || 7,
      },
      provider as 'mock' | 'openai' | 'gemini',
      apiKey
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar carrossel' },
      { status: 500 }
    );
  }
}
