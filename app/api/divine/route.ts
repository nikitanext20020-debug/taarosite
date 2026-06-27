/**
 * POST /api/divine
 * Создать расклад: тасует карты, сохраняет в БД, возвращает позиции.
 * Интерпретация НЕ возвращается — она генерируется отдельно после paywall.
 *
 * body: { spreadId, theme?, question?, tgUser }
 */

import { NextResponse } from 'next/server';
import { getSpread } from '@/lib/tarot/spreads';
import { drawCards, serializeCards } from '@/lib/tarot/draw';
import { upsertUser, upsertWebUser, canReadForFree } from '@/lib/user-service';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { spreadId, theme, question, tgUser, webUserId } = body as {
      spreadId: string;
      theme?: string;
      question?: string;
      tgUser?: { id: number; first_name?: string; username?: string };
      webUserId?: string;
    };

    if (!spreadId) {
      return NextResponse.json({ error: 'spreadId обязателен' }, { status: 400 });
    }

    const spread = getSpread(spreadId);

    // Тасуем карты
    const { seed, cards } = drawCards(spread, undefined, question);
    const serialized = serializeCards(cards);

    // Идентификация пользователя (Telegram или Web)
    let userId: string | null = null;
    let freeAvailable = false;

    if (tgUser?.id) {
      const u = await upsertUser(tgUser as any);
      if (u) {
        userId = u.id;
        freeAvailable = await canReadForFree({ tgId: tgUser.id });
      }
    } else if (webUserId) {
      const u = await upsertWebUser(webUserId);
      if (u) {
        userId = u.id;
        freeAvailable = await canReadForFree({ webId: webUserId });
      }
    }

    // Сохраним расклад (интерпретация пока null)
    const createData: Record<string, unknown> = {
      spreadType: spread.id,
      theme: theme ?? null,
      question: question ?? null,
      seed: String(seed),
      cards: JSON.stringify(serialized),
      interpretation: null,
      interpreted: false,
      revealed: false,
    };
    if (userId) {
      createData.user = { connect: { id: userId } };
    }
    const reading = await prisma.reading.create({ data: createData as any });

    return NextResponse.json({
      readingId: reading.id,
      spreadId: spread.id,
      seed,
      cards: serialized,
      positions: spread.positions.map((p) => ({ title: p.title, hint: p.hint })),
      freeAvailable,
    });
  } catch (e) {
    console.error('[/api/divine] error', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
