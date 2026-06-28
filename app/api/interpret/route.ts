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
export const dynamic = 'force-dynamic';

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
    let subscribed = false;
    let usedFree = false;

    if (tgUser) {
      const subResult = await checkSubscription(tgUser.id);
      subscribed = subResult.subscribed;

      if (!subscribed) {
        const user = await prisma.user.findUnique({
          where: { telegramId: String(tgUser.id) },
        });

        if (user && user.freeReadsLeft > 0) {
          await consumeFreeRead({ tgId: tgUser.id });
          usedFree = true;
          subscribed = true;
        }
      }
    } else if (webUserId) {
      const user = await prisma.user.findUnique({
        where: { webId: webUserId },
      });

      if (user && user.freeReadsLeft > 0) {
        await consumeFreeRead({ webId: webUserId });
        usedFree = true;
        subscribed = true;
      }
    }

    if (!subscribed) {
      return NextResponse.json(
        {
          error: 'paywall',
          message: 'Закончились бесплатные гадания. Подпишитесь на канал.',
          needSubscription: true,
        },
        { status: 403 },
      );
    }
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
        positionTitle: pos?.title ?? (c.position === 0 ? 'Фоновая карта' : `Позиция ${c.position}`),
      };
    });

    const userPrompt = buildUserPrompt({
      question: reading.question ?? undefined,
      theme: reading.theme ?? undefined,
      spreadName: spread.name,
      positions: spread.positions,
      cards: cardList,
      userName: reading.userName ?? undefined,
      targetName: reading.targetName ?? undefined,
    });

    const deck = getDeck(reading.deckId);
    const systemPrompt = buildSystemPrompt(deck.name);

    const { text, meta } = await interpretReading({
      systemPrompt,
      userPrompt,
    });

    const disclaimer = `

---
Важное напоминание:  
Таро — это инструмент для размышления. Ты сам несёшь полную ответственность за все свои решения и действия.  
Расклад не заменяет профессиональную юридическую, медицинскую или финансовую помощь.  
Также ты сам отвечаешь за своё эмоциональное и ментальное состояние после прочтения расклада.`;

    let finalInterpretation = text;
    if (!finalInterpretation.includes('Важное напоминание') && !finalInterpretation.includes('Важно помнить')) {
      finalInterpretation += disclaimer;
    }

    // Сохраним интерпретацию + лог
    await prisma.reading.update({
      where: { id: readingId },
      data: {
        interpretation: finalInterpretation,
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
