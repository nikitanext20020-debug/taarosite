/**
 * POST /api/interpret
 * Открывает ТЕКСТ расклада — ТОЛЬКО если:
 *  - пользователь подписан на канал, ИЛИ
 *  - есть бесплатные расклады (тогда списываем один)
 *
 * Это ключевая точка ВОРОНКИ: paywall.
 *
 * body: { readingId, tgUser: { id } }
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkSubscription } from '@/lib/telegram/subscription';
import { upsertUser, consumeFreeRead } from '@/lib/user-service';
import { getSpread } from '@/lib/tarot/spreads';
import { getCard } from '@/lib/tarot/deck';
import { getDeck } from '@/lib/tarot/decks';
import { interpretReading } from '@/lib/ai';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompt';
import { site } from '@/lib/site';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { readingId, tgUser, webUserId } = (await req.json()) as {
      readingId: string;
      tgUser?: { id: number };
      webUserId?: string;
    };

    if (!readingId) {
      return NextResponse.json({ error: 'readingId обязателен' }, { status: 400 });
    }

    const reading = await prisma.reading.findUnique({ where: { id: readingId } });
    if (!reading) {
      return NextResponse.json({ error: 'Расклад не найден' }, { status: 404 });
    }

    // ── PAYWALL ──────────────────────────────────────────────
    // ДЕМО-ЗАГЛУШКА: временно отключаем ограничения подписки для свободного тестирования
    let subscribed = true;
    let usedFree = false;
    // ── /PAYWALL ─────────────────────────────────────────────

    // Если интерпретация уже была — отдаём
    if (reading.interpreted && reading.interpretation) {
      await prisma.reading.update({
        where: { id: readingId },
        data: { revealed: true, revealedAt: new Date() },
      });
      return NextResponse.json({
        text: reading.interpretation,
        revealed: true,
        cached: true,
      });
    }

    // Генерация интерпретации нейросетью
    const spread = getSpread(reading.spreadType);
    const cardsData = JSON.parse(reading.cards) as {
      id: number;
      reversed: boolean;
      position: number;
    }[];
    const cardList = cardsData.map((c) => {
      const card = getCard(c.id);
      const pos = spread.positions.find((p) => p.index === c.position);
      return {
        name: card.name,
        reversed: c.reversed,
        positionTitle: pos?.title ?? `Позиция ${c.position}`,
      };
    });

    const userPrompt = buildUserPrompt({
      question: reading.question ?? undefined,
      theme: reading.theme ?? undefined,
      spreadName: spread.name,
      positions: spread.positions,
      cards: cardList,
    });

    const deck = getDeck(reading.deckId);
    const systemPrompt = buildSystemPrompt(deck.name);

    const { text, meta } = await interpretReading({
      systemPrompt,
      userPrompt,
    });

    // Сохраним интерпретацию + лог
    await prisma.reading.update({
      where: { id: readingId },
      data: {
        interpretation: text,
        interpreted: true,
        revealed: true,
        revealedAt: new Date(),
      },
    });

    await prisma.aiLog.create({
      data: {
        readingId,
        provider: (meta as any).provider ?? 'unknown',
        model: meta.model,
        prompt: userPrompt,
        response: text,
        tokensIn: meta.tokensIn,
        tokensOut: meta.tokensOut,
        latencyMs: meta.latencyMs,
        success: true,
      },
    });

    return NextResponse.json({ text, revealed: true });
  } catch (e) {
    console.error('[/api/interpret] error', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
