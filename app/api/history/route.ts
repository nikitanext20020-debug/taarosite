/**
 * POST /api/history
 * Возвращает историю раскладов пользователя.
 *
 * body: { tgUser: { id } }
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { upsertUser, upsertWebUser } from '@/lib/user-service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { tgUser, webUserId } = (await req.json()) as {
      tgUser?: { id: number };
      webUserId?: string;
    };

    let user = null;
    if (tgUser?.id) {
      user = await upsertUser(tgUser as any);
    } else if (webUserId) {
      user = await upsertWebUser(webUserId);
    }

    if (!user) {
      return NextResponse.json({ readings: [] });
    }

    const readings = await prisma.reading.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        spreadType: true,
        theme: true,
        question: true,
        cards: true,
        createdAt: true,
        revealed: true,
      },
    });

    // cards — это JSON-строка в SQLite, парсим перед отправкой
    const serialized = readings.map((r) => ({
      ...r,
      cards: typeof r.cards === 'string' ? JSON.parse(r.cards) : r.cards,
    }));

    return NextResponse.json({ readings: serialized });
  } catch (e) {
    console.error('[/api/history] error', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
